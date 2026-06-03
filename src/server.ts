/**
 * Ponto de entrada do servidor HTTP do SupportBox.
 *
 * Responsabilidades deste arquivo:
 *  - ler a porta de execucao a partir de `process.env.PORT` (fallback 4000);
 *  - montar o manipulador de requisicoes (dispatcher) via `criarManipulador`;
 *  - subir um servidor HTTP nativo do Node (`node:http`) na porta escolhida;
 *  - logar o endereco completo quando o servidor estiver pronto para aceitar
 *    conexoes.
 *
 * Decisoes de projeto refletidas aqui:
 *  - Sem framework (Express, Fastify, Koa, etc.) - usamos somente o modulo
 *    nativo `http`. O backend e simples o bastante para nao justificar uma
 *    dependencia externa.
 *  - Sem `dotenv` - se houver necessidade de arquivo `.env` no futuro,
 *    isso entra junto com a camada de Service e a integracao com banco.
 *  - O ciclo de vida do servidor e direto: cria, escuta, loga. Nao ha
 *    tratamento de SIGINT/SIGTERM nem reinicializacoes automaticas - esse
 *    nivel de robustez fica para uma etapa posterior, quando virar producao.
 *
 * Arquitetura geral do backend (padrao MVC):
 *  - View       : frontend Next.js (outro projeto).
 *  - Controller : recebe HTTP e responde HTTP (esta etapa).
 *  - Model      : neste projeto NAO e uma camada unica; divide-se em
 *      * Service : regras de negocio / validacao (em andamento).
 *      * DAO     : exclusivo para persistencia e banco (a criar).
 */
import { createServer } from "http";
import { criarManipulador } from "./app";

/**
 * Porta TCP em que o servidor HTTP vai escutar.
 *
 * Lida via variavel de ambiente `PORT`. Caso nao esteja setada, usamos
 * 4000 como padrao. `Number(...)` converte a string da env em numero -
 * se a env contiver algo invalido (ex.: "abc"), o resultado sera `NaN`
 * e `server.listen(NaN)` selecionara uma porta aleatoria. Uma validacao
 * formal de PORT pode ser adicionada quando o projeto for para producao.
 */
const PORTA = Number(process.env.PORT ?? 4000);

/**
 * Cria o servidor HTTP usando o dispatcher exportado por `app.ts` e
 * inicia a escuta na porta configurada. O callback de `.listen()` so
 * executa quando o socket esta efetivamente aberto, garantindo que a
 * mensagem de log so apareca quando o servidor esta de fato pronto.
 */
createServer(criarManipulador()).listen(PORTA, () => {
  console.log(`[supportbox-backend] http://localhost:${PORTA}`);
});
