# Dominó Ponta de Quina — CP6 C#

**Integrantes**
- Ricardo Fernandes de Aquino — RM554597
- Khadija do Rocio Vieira de Lima — RM558971

Jogo de navegador em **Blazor Web App (.NET 8, Interactive Server)** que consome a API
[Dominó Ponta de Quina](https://domino-quina-atbkg6ckcwbpd5gz.westus3-01.azurewebsites.net/swagger).

Os componentes rodam no servidor, então as chamadas HTTP saem do servidor ASP.NET (a API não habilita CORS
para chamadas feitas direto do navegador).

## Como rodar
```bash
cd DominoQuina
dotnet run
```
Abra a URL exibida no terminal (ex.: http://localhost:5xxx).

## Deploy (Render, gratuito)
O repositório tem `render.yaml` + `DominoQuina/Dockerfile`. No Render: **New → Blueprint**, escolha este repositório e confirme.
(Plano free dorme após ~15 min sem acesso; o primeiro acesso depois disso demora ~1 min.)

## Como jogar
1. **Conta**: informe seu e-mail FIAP para receber o token e cole o token recebido.
2. **Jogadores**: crie um jogador e clique em **Ativar** (o app gera a chave de ativação de 64 hex e guarda no navegador). Depois clique em **Jogar com este**.
3. **Lobby**: crie uma partida (pontuação alvo) ou entre numa partida aguardando adversário.
4. **Partida**: com 2 participantes, clique em **Iniciar**. Na sua vez, selecione uma pedra e jogue na ponta esquerda ou direita, ou use **Comprar**/**Passar**. A tela se atualiza sozinha (polling em `/atualizacoes`). No final aparecem o vencedor e o histórico.

Para testar sozinho: crie 2 jogadores e abra 2 abas, cada uma com um jogador diferente
(o jogador selecionado fica no `sessionStorage` da aba; token e chaves ficam no `localStorage`).

## Estrutura
| Arquivo | Papel |
|---|---|
| `DominoApi.cs` | Cliente HTTP tipado: um método por endpoint, Bearer + `X-Jogador-Ativacao`, erros viram `ApiException` |
| `Models.cs` | DTOs do swagger |
| `Sessao.cs` | Token, chaves de ativação e jogador selecionado (Protected Browser Storage) |
| `ApiException.cs` | Códigos de erro da API traduzidos em mensagens |
| `Components/Pages/*` | Telas: Conta, Jogadores, Lobby, Partida |
| `Components/Shared/Pedra.razor` | Pedra de dominó desenhada em CSS |
