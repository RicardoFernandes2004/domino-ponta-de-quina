namespace DominoQuina;

// Lance escolhido pelo jogador autônomo. Acao usa os nomes de DominoApi.AgirAsync (jogar | comprar).
public record Decisao(string Acao, Peca? Peca = null, int Lado = 0);

// Regras do lado do cliente: escolha do jogador autônomo e prévia da penalidade por demora.
// A API continua sendo a autoridade: aqui só se decide o que tentar.
public static class Estrategia
{
    // Pontas abertas (esquerda, direita). A API devolve o tabuleiro em ordem, mas sem orientar cada pedra,
    // então reorienta como wwwroot/mesa.js (orientar): cada pedra encosta na vizinha pelo valor igual.
    public static (int E, int D)? Pontas(IReadOnlyList<Peca>? tabuleiro)
    {
        if (tabuleiro is not { Count: > 0 }) return null;
        var (e, d) = (tabuleiro[0].ValorA, tabuleiro[0].ValorB);
        if (tabuleiro.Count > 1)
        {
            var s = tabuleiro[1];
            if (s.ValorA != d && s.ValorB != d && (s.ValorA == e || s.ValorB == e)) (e, d) = (d, e);
        }
        for (var i = 1; i < tabuleiro.Count; i++)
        {
            var p = tabuleiro[i];
            d = p.ValorA == d ? p.ValorB : p.ValorB == d ? p.ValorA : p.ValorB;
        }
        return (e, d);
    }

    // Abertura obrigatória > lance que mais pontua (soma das pontas múltipla de 5) > pedra mais pesada > comprar.
    public static Decisao Decidir(EstadoPartida estado)
    {
        var mao = estado.MinhaMao ?? [];
        if (Pontas(estado.Tabuleiro) is not var (e, d))
        {
            var abre = estado.PedraAberturaObrigatoria ?? mao.MaxBy(p => (p.ValorA == p.ValorB, p.ValorA + p.ValorB));
            return abre is null ? new("comprar") : new("jogar", abre, 0);
        }

        var lances =
            from p in mao
            from lado in new[] { 0, 1 }
            let ponta = lado == 0 ? e : d
            where p.ValorA == ponta || p.ValorB == ponta
            let nova = p.ValorA == ponta ? p.ValorB : p.ValorA
            let soma = lado == 0 ? nova + d : e + nova
            select (p, lado, pontos: soma % 5 == 0 ? soma / 5 : 0);

        var melhor = lances.OrderByDescending(l => l.pontos).ThenByDescending(l => l.p.ValorA + l.p.ValorB).FirstOrDefault();
        return melhor.p is null ? new("comprar") : new("jogar", melhor.p, melhor.lado);
    }

    // Desconto por demora (regra futura, slide 14): só prévia na tela, a API ainda não aplica.
    public static int Penalidade(TimeSpan t) => t.TotalSeconds switch
    {
        <= 10 => 0,
        <= 30 => 1,
        < 60 => 2,
        _ => 3,
    };
}
