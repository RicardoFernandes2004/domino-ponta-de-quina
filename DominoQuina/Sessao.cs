using System.Text.Json;
using Microsoft.JSInterop;

namespace DominoQuina;

// Estado do usuário neste navegador.
// Token e chaves de ativação ficam no localStorage (compartilhado entre abas e sobrevive a reload:
// perder a chave deixaria o jogador preso em JOGADOR_JA_ATIVO).
// O jogador selecionado fica no sessionStorage, para cada aba poder jogar com um jogador diferente.
// Armazenamento simples (não criptografado pelo servidor): assim os dados sobrevivem a reinícios/deploys
// do servidor, que trocariam a chave do Data Protection e tornariam ilegível o que estava salvo.
public class Sessao(IJSRuntime js)
{
    readonly Armazem local = new(js, "localStorage"), aba = new(js, "sessionStorage");
    Dictionary<Guid, string> chaves = [];
    Dictionary<Guid, List<Guid>> partidas = []; // jogadorId -> partidas (mais recente primeiro)
    bool carregado;

    public string? Token { get; private set; }
    public Guid? JogadorId { get; private set; }
    public string? JogadorNome { get; private set; }

    public async Task CarregarAsync()
    {
        if (carregado) return;
        carregado = true;
        Token = await Ler<string>(local, "token");
        chaves = await Ler<Dictionary<Guid, string>>(local, "chaves") ?? [];
        partidas = await Ler<Dictionary<Guid, List<Guid>>>(local, "partidas") ?? [];
        JogadorId = await Ler<Guid?>(aba, "jogadorId");
        JogadorNome = await Ler<string>(aba, "jogadorNome");
    }

    public string? Chave(Guid jogadorId) => chaves.GetValueOrDefault(jogadorId);

    // A API não lista as partidas de um jogador; guardamos aqui para poder voltar a elas.
    public IReadOnlyList<Guid> Partidas => JogadorId is { } j ? partidas.GetValueOrDefault(j) ?? [] : [];

    public async Task LembrarPartidaAsync(Guid partidaId)
    {
        if (JogadorId is not { } j) return;
        var lista = partidas.GetValueOrDefault(j) ?? [];
        if (lista.FirstOrDefault() == partidaId) return;
        lista.Remove(partidaId);
        lista.Insert(0, partidaId);
        partidas[j] = lista.Take(10).ToList();
        await local.SetAsync("partidas", partidas);
    }

    public async Task DefinirTokenAsync(string? token)
    {
        Token = token;
        if (token is null) await local.DeleteAsync("token");
        else await local.SetAsync("token", token);
    }

    public async Task GuardarChaveAsync(Guid jogadorId, string chave)
    {
        chaves[jogadorId] = chave;
        await local.SetAsync("chaves", chaves);
    }

    public async Task RemoverChaveAsync(Guid jogadorId)
    {
        chaves.Remove(jogadorId);
        await local.SetAsync("chaves", chaves);
        if (JogadorId == jogadorId) await SelecionarAsync(null, null);
    }

    public async Task SelecionarAsync(Guid? jogadorId, string? nome)
    {
        (JogadorId, JogadorNome) = (jogadorId, nome);
        if (jogadorId is { } id) await aba.SetAsync("jogadorId", id);
        else await aba.DeleteAsync("jogadorId");
        await aba.SetAsync("jogadorNome", nome ?? "");
    }

    static async Task<T?> Ler<T>(Armazem s, string chave)
    {
        try { return await s.GetAsync<T>(chave); }
        catch (JsonException) { return default; } // dado corrompido: trata como ausente
    }

    sealed class Armazem(IJSRuntime js, string nome)
    {
        public async Task<T?> GetAsync<T>(string chave)
        {
            var json = await js.InvokeAsync<string?>($"{nome}.getItem", chave);
            return json is null ? default : JsonSerializer.Deserialize<T>(json);
        }
        public ValueTask SetAsync<T>(string chave, T valor) => js.InvokeVoidAsync($"{nome}.setItem", chave, JsonSerializer.Serialize(valor));
        public ValueTask DeleteAsync(string chave) => js.InvokeVoidAsync($"{nome}.removeItem", chave);
    }
}
