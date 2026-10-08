using System.Net;
using System.Text;
using DominoQuina;
using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.JSInterop;

namespace DominoQuina.Tests;

public class ApiExceptionTests
{
    [Fact]
    public void Traduz_codigo_conhecido()
    {
        var e = new ApiException("ENCAIXE_INVALIDO");
        Assert.Equal("ENCAIXE_INVALIDO", e.Codigo);
        Assert.Equal("Essa pedra não encaixa nessa ponta.", e.Message);
    }

    [Fact]
    public void Codigo_desconhecido_vira_a_propria_mensagem() =>
        Assert.Equal("ALGO_NOVO", new ApiException("ALGO_NOVO").Message);
}

public class DominoApiTests
{
    // localStorage/sessionStorage falsos: escrever não faz nada, ler devolve vazio.
    class JsFalso : IJSRuntime
    {
        public ValueTask<T> InvokeAsync<T>(string id, object?[]? args) => default;
        public ValueTask<T> InvokeAsync<T>(string id, CancellationToken c, object?[]? args) => default;
    }

    class NavFalso : NavigationManager
    {
        public string? Destino;
        public NavFalso() => Initialize("http://localhost/", "http://localhost/partida");
        protected override void NavigateToCore(string uri, NavigationOptions options) => Destino = uri;
    }

    class HandlerFalso(HttpStatusCode status, string? json = null) : HttpMessageHandler
    {
        public HttpRequestMessage? Requisicao;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage r, CancellationToken c)
        {
            Requisicao = r;
            var resp = new HttpResponseMessage(status);
            if (json is not null) resp.Content = new StringContent(json, Encoding.UTF8, "application/json");
            return Task.FromResult(resp);
        }
    }

    static readonly Guid Jogador = Guid.NewGuid(), Partida = Guid.NewGuid();
    const string Chave = "ab12";

    static async Task<(DominoApi, Sessao, NavFalso)> Criar(HandlerFalso h)
    {
        var s = new Sessao(new JsFalso());
        await s.DefinirTokenAsync("tok");
        await s.GuardarChaveAsync(Jogador, Chave);
        await s.SelecionarAsync(Jogador, "Ana");
        var nav = new NavFalso();
        var http = new HttpClient(h) { BaseAddress = new Uri("https://api.teste/") };
        return (new DominoApi(http, s, nav, NullLogger<DominoApi>.Instance), s, nav);
    }

    static string EstadoJson(long versao) =>
        $$"""{"partidaId":"{{Partida}}","versaoEstado":{{versao}},"situacao":1,"numeroRodada":1,"proximaAcao":2,"participacaoId":"{{Guid.NewGuid()}}"}""";

    [Fact]
    public async Task Envia_bearer_chave_de_ativacao_e_versao()
    {
        var h = new HandlerFalso(HttpStatusCode.OK, $$"""{"chaveIdempotencia":"{{Guid.NewGuid()}}","acaoIdempotente":false,"estado":{{EstadoJson(8)}}}""");
        var (api, _, _) = await Criar(h);

        var estado = await api.AgirAsync(Partida, "jogar", 7, new Peca(6, 1), 1);

        Assert.Equal(8, estado.VersaoEstado);
        Assert.Equal("Bearer tok", h.Requisicao!.Headers.Authorization!.ToString());
        Assert.Equal(Chave, h.Requisicao.Headers.GetValues("X-Jogador-Ativacao").Single());
        Assert.EndsWith($"api/partidas/{Partida}/jogar", h.Requisicao.RequestUri!.ToString());
        var corpo = await h.Requisicao.Content!.ReadAsStringAsync();
        Assert.Contains("\"versaoEsperada\":7", corpo);
        Assert.Contains("\"valorA\":6", corpo);
        Assert.Contains("\"lado\":1", corpo);
    }

    [Fact]
    public async Task Atualizacoes_204_devolve_null()
    {
        var (api, _, _) = await Criar(new HandlerFalso(HttpStatusCode.NoContent));
        Assert.Null(await api.AtualizacoesAsync(Partida, 3));
    }

    [Fact]
    public async Task Rejeicao_vira_ApiException_com_estado_autoritativo()
    {
        var h = new HandlerFalso(HttpStatusCode.Conflict, $$"""{"codigo":"CONFLITO_DE_ESTADO","estadoAutoritativo":{{EstadoJson(9)}}}""");
        var (api, _, _) = await Criar(h);

        var e = await Assert.ThrowsAsync<ApiException>(() => api.AgirAsync(Partida, "comprar", 7));

        Assert.Equal("CONFLITO_DE_ESTADO", e.Codigo);
        Assert.Equal(9, e.EstadoAutoritativo!.VersaoEstado);
    }

    [Fact]
    public async Task Erro_sem_envelope_json_mostra_status_http()
    {
        var (api, _, _) = await Criar(new HandlerFalso(HttpStatusCode.BadGateway));
        var e = await Assert.ThrowsAsync<ApiException>(() => api.EstadoAsync(Partida));
        Assert.Equal("Erro HTTP 502", e.Codigo);
    }

    [Fact]
    public async Task Status_401_esquece_o_token_e_volta_para_o_login()
    {
        var (api, s, nav) = await Criar(new HandlerFalso(HttpStatusCode.Unauthorized, """{"codigo":"NAO_AUTENTICADO"}"""));

        var e = await Assert.ThrowsAsync<ApiException>(() => api.JogadoresAsync());

        Assert.Equal("NAO_AUTENTICADO", e.Codigo);
        Assert.Null(s.Token);
        Assert.Equal("/", nav.Destino);
    }
}
