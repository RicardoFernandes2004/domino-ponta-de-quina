using DominoQuina;
using Microsoft.JSInterop;

namespace DominoQuina.Tests;

public class SessaoTests
{
    // localStorage em memória compartilhado entre "abas" (instâncias de Sessao).
    class JsMemoria(Dictionary<string, string> dados) : IJSRuntime
    {
        public ValueTask<T> InvokeAsync<T>(string id, object?[]? args) => InvokeAsync<T>(id, default, args);
        public ValueTask<T> InvokeAsync<T>(string id, CancellationToken c, object?[]? args)
        {
            var chave = (string)args![0]!;
            if (id.EndsWith(".getItem")) return ValueTask.FromResult((T)(object?)dados.GetValueOrDefault(chave)!);
            if (id.EndsWith(".setItem")) dados[chave] = (string)args[1]!;
            else dados.Remove(chave);
            return ValueTask.FromResult(default(T)!);
        }
    }

    [Fact]
    public async Task Aba_nao_apaga_chave_salva_por_outra_aba()
    {
        var storage = new Dictionary<string, string>();
        var aba1 = new Sessao(new JsMemoria(storage));
        var aba2 = new Sessao(new JsMemoria(storage));
        await aba1.CarregarAsync();
        await aba2.CarregarAsync();
        Guid a = Guid.NewGuid(), b = Guid.NewGuid();

        await aba2.GuardarChaveAsync(a, "chave-a");
        await aba1.GuardarChaveAsync(b, "chave-b");

        var recarregada = new Sessao(new JsMemoria(storage));
        await recarregada.CarregarAsync();
        Assert.Equal("chave-a", recarregada.Chave(a));
        Assert.Equal("chave-b", recarregada.Chave(b));
    }
}
