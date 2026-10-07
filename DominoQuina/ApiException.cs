namespace DominoQuina;

public class ApiException(string codigo, EstadoPartida? estado = null) : Exception(Traduzir(codigo))
{
    public string Codigo { get; } = codigo;
    public EstadoPartida? EstadoAutoritativo { get; } = estado;

    static string Traduzir(string c) => c switch
    {
        "NAO_AUTENTICADO" => "Token ausente, inválido ou revogado.",
        "SEM_PERMISSAO" => "Sem permissão para esta operação (o jogador está ativado neste navegador?).",
        "JOGADOR_JA_ATIVO" => "Este jogador já está ativo em outro cliente.",
        "PARTIDA_INDISPONIVEL" => "Partida não encontrada ou indisponível.",
        "CONFLITO_DE_ESTADO" => "A partida mudou enquanto você agia; a tela foi atualizada, tente de novo.",
        "ESTADO_INVALIDO" => "Ação inválida no estado atual da partida.",
        "FORA_DO_TURNO" => "Não é a sua vez.",
        "PECA_AUSENTE" => "Essa pedra não está na sua mão.",
        "ENCAIXE_INVALIDO" => "Essa pedra não encaixa nessa ponta.",
        "PASSAGEM_NAO_PERMITIDA" => "Você ainda pode jogar ou comprar; não pode passar.",
        "LIMITE_EXCEDIDO" => "Muitas solicitações; aguarde alguns minutos.",
        "ENTRADA_INVALIDA" => "Dados inválidos; revise os campos.",
        "ERRO_INTERNO" => "Erro interno na API.",
        _ => c
    };
}
