using System.Net;
using System.Net.Http.Headers;

namespace DominoQuina;

// Cliente tipado da API Dominó Ponta de Quina. Roda no servidor (Blazor Server), por isso não depende de CORS.
public class DominoApi(HttpClient http, Sessao s, ILogger<DominoApi> log)
{
    static readonly System.Text.Json.JsonSerializerOptions Json = new(System.Text.Json.JsonSerializerDefaults.Web);

    Guid J => s.JogadorId ?? throw new ApiException("Selecione um jogador primeiro.");

    // ---------- Identidade ----------
    public Task SolicitarTokenAsync(string email) => Enviar(HttpMethod.Post, "api/identidade/token", new { email });
    public Task<SessaoResponse?> SessaoAsync() => Obter<SessaoResponse>(HttpMethod.Get, "api/identidade/sessao");
    public Task RevogarTokenAsync() => Enviar(HttpMethod.Post, "api/identidade/tokens/revogacao");

    // ---------- Jogadores ----------
    public Task<List<PerfilJogador>?> JogadoresAsync() => Obter<List<PerfilJogador>>(HttpMethod.Get, "api/jogadores");
    public Task<PerfilJogador?> CriarJogadorAsync(string nome) => Obter<PerfilJogador>(HttpMethod.Post, "api/jogadores", new { nome });

    public Task<PerfilJogador?> AtivarAsync(Guid jogadorId, string chave) =>
        Obter<PerfilJogador>(HttpMethod.Post, $"api/jogadores/{jogadorId}/ativar-cliente", new { chaveAtivacao = chave });

    public Task<PerfilJogador?> LiberarAsync(Guid jogadorId) =>
        Obter<PerfilJogador>(HttpMethod.Delete, $"api/jogadores/{jogadorId}/desativar-cliente", jogador: jogadorId);

    // ---------- Partidas ----------
    public Task<List<PartidaDisponivel>?> PartidasDisponiveisAsync() => Obter<List<PartidaDisponivel>>(HttpMethod.Get, "api/partidas");

    public async Task<EstadoPartida> CriarPartidaAsync(int pontuacaoAlvo) =>
        (await Obter<EstadoPartida>(HttpMethod.Post, "api/partidas", new { pontuacaoAlvo, jogadorId = J }, J))!;

    public async Task<EstadoPartida> EstadoAsync(Guid partidaId) =>
        (await Obter<EstadoPartida>(HttpMethod.Get, $"api/partidas/{partidaId}?jogadorId={J}", jogador: J))!;

    // null = nada mudou desde versaoConhecida (204).
    public Task<EstadoPartida?> AtualizacoesAsync(Guid partidaId, long versaoConhecida) =>
        Obter<EstadoPartida>(HttpMethod.Get, $"api/partidas/{partidaId}/atualizacoes?jogadorId={J}&versaoConhecida={versaoConhecida}", jogador: J);

    public Task<Resultado?> ResultadoAsync(Guid partidaId) =>
        Obter<Resultado>(HttpMethod.Get, $"api/partidas/{partidaId}/resultado?jogadorId={J}", jogador: J);

    // acao: entrar | iniciar | comprar | passar | jogar. Cada chamada é uma intenção nova (UUID novo).
    public async Task<EstadoPartida> AgirAsync(Guid partidaId, string acao, long versao, Peca? peca = null, int lado = 0)
    {
        object corpo = peca is null
            ? new { jogadorId = J, versaoEsperada = versao, chaveIdempotencia = Guid.NewGuid() }
            : new { jogadorId = J, versaoEsperada = versao, chaveIdempotencia = Guid.NewGuid(), peca.ValorA, peca.ValorB, lado };
        return (await Obter<Confirmacao>(HttpMethod.Post, $"api/partidas/{partidaId}/{acao}", corpo, J))!.Estado;
    }

    // ---------- HTTP ----------
    async Task Enviar(HttpMethod m, string url, object? corpo = null, Guid? jogador = null)
    {
        using var _ = await Requisitar(m, url, corpo, jogador);
    }

    async Task<T?> Obter<T>(HttpMethod m, string url, object? corpo = null, Guid? jogador = null)
    {
        using var resp = await Requisitar(m, url, corpo, jogador);
        return resp.StatusCode == HttpStatusCode.NoContent ? default : await resp.Content.ReadFromJsonAsync<T>();
    }

    async Task<HttpResponseMessage> Requisitar(HttpMethod m, string url, object? corpo, Guid? jogador)
    {
        var req = new HttpRequestMessage(m, url);
        if (s.Token is { } token) req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (jogador is { } j && s.Chave(j) is { } chave) req.Headers.Add("X-Jogador-Ativacao", chave);
        if (corpo is not null) req.Content = JsonContent.Create(corpo);

        var resp = await http.SendAsync(req);
        if (resp.IsSuccessStatusCode) return resp;

        var corpoErro = await resp.Content.ReadAsStringAsync();
        log.LogWarning("API {Metodo} {Url} -> {Status}: {Corpo}", m, url, (int)resp.StatusCode, corpoErro);
        RespostaErro? erro = null;
        try { erro = System.Text.Json.JsonSerializer.Deserialize<RespostaErro>(corpoErro, Json); }
        catch { } // corpo pode não ser o envelope JSON
        resp.Dispose();
        throw new ApiException(erro?.Codigo ?? $"Erro HTTP {(int)resp.StatusCode}", erro?.EstadoAutoritativo);
    }
}
