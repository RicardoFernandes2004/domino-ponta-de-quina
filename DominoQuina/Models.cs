namespace DominoQuina;

// DTOs da API (JSON camelCase, enums numéricos).
public record Peca(int ValorA, int ValorB);

public record Participante(Guid JogadorId, string? Nome, int Pontuacao, int QuantidadePedrasNaMao, bool EhVez);

public record EstadoPartida(
    Guid PartidaId, long VersaoEstado, int Situacao, int NumeroRodada, Guid? JogadorDoTurnoId,
    List<Peca>? MinhaMao, List<Peca>? Tabuleiro, List<Participante>? Participantes,
    Guid? VencedorId, int ProximaAcao, Peca? PedraAberturaObrigatoria, Guid ParticipacaoId);

public record Confirmacao(Guid ChaveIdempotencia, bool AcaoIdempotente, EstadoPartida Estado);

public record PerfilJogador(Guid JogadorId, string? Nome, bool Ativo, DateTime? AtivadoEmUtc);

public record PartidaDisponivel(Guid PartidaId, int PontuacaoAlvo, long VersaoEstado);

public record Evento(Guid EventoId, Guid JogadorId, Peca? PecaJogada, int Lado, bool PassouVez, int PontosConcedidos, DateTime RecebidoEmUtc);

public record Resultado(Guid PartidaId, int Situacao, long VersaoEstado, Guid? VencedorId, List<Participante>? Participantes, List<Evento>? Eventos);

public record SessaoResponse(string? UsuarioId);

public record RespostaErro(string? Codigo, EstadoPartida? EstadoAutoritativo);

public static class Situacao
{
    public const int Aguardando = 0, EmAndamento = 1, Encerrada = 2;
}
