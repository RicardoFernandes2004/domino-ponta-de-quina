using DominoQuina;

namespace DominoQuina.Tests;

public class EstrategiaTests
{
    static EstadoPartida Estado(List<Peca> mao, List<Peca> tabuleiro, Peca? abertura = null) =>
        new(Guid.NewGuid(), 1, Situacao.EmAndamento, 1, null, mao, tabuleiro, [], null, 0, abertura, Guid.NewGuid());

    [Fact]
    public void Pontas_reorienta_pedras_invertidas()
    {
        // Cadeia real: 3|6 · 6|6 · 6|1 · 1|4, mas a API pode mandar as pedras sem orientar.
        List<Peca> tab = [new(6, 3), new(6, 6), new(1, 6), new(4, 1)];
        Assert.Equal((3, 4), Estrategia.Pontas(tab));
    }

    [Fact]
    public void Pontas_de_mesa_vazia_e_null() => Assert.Null(Estrategia.Pontas([]));

    [Fact]
    public void Joga_a_abertura_obrigatoria()
    {
        var d = Estrategia.Decidir(Estado([new(1, 2), new(6, 6)], [], abertura: new(6, 6)));
        Assert.Equal(new Decisao("jogar", new Peca(6, 6), 0), d);
    }

    [Fact]
    public void Prefere_o_lance_que_pontua()
    {
        // Pontas 3 e 4. 4|2 na direita → 3+2 = 5 (1 ponto). 3|6 na esquerda → 6+4 = 10 (2 pontos).
        var d = Estrategia.Decidir(Estado([new(4, 2), new(3, 6)], [new(3, 4)]));
        Assert.Equal(new Decisao("jogar", new Peca(3, 6), 0), d);
    }

    [Fact]
    public void Sem_pontos_joga_a_pedra_mais_pesada()
    {
        // Pontas 1 e 1: 1|2 → soma 3, 1|3 → soma 4; nenhuma pontua, sai a mais pesada.
        var d = Estrategia.Decidir(Estado([new(1, 2), new(1, 3)], [new(1, 1)]));
        Assert.Equal("jogar", d.Acao);
        Assert.Equal(new Peca(1, 3), d.Peca);
    }

    [Fact]
    public void Compra_quando_nada_encaixa() =>
        Assert.Equal(new Decisao("comprar"), Estrategia.Decidir(Estado([new(5, 5)], [new(1, 2)])));

    [Theory]
    [InlineData(0, 0), InlineData(10, 0), InlineData(10.5, 1), InlineData(30, 1),
     InlineData(30.5, 2), InlineData(59.9, 2), InlineData(60, 3), InlineData(300, 3)]
    public void Penalidade_segue_a_tabela(double segundos, int esperado) =>
        Assert.Equal(esperado, Estrategia.Penalidade(TimeSpan.FromSeconds(segundos)));
}
