/**
 * Dispatcher de requisicoes HTTP.
 *
 * Este modulo expoe `criarManipulador()`, que devolve uma funcao no
 * formato esperado por `http.createServer((req, res) => ...)`. A funcao
 * retornada percorre a tabela de rotas declarada em `routes/index.ts` e,
 * para cada requisicao recebida:
 *
 *  1. analisa a URL (caminho + query string) usando a classe `URL`;
 *  2. tenta casar o metodo HTTP + path contra cada rota da tabela;
 *  3. ao encontrar match:
 *     a. extrai parametros nomeados do path (`:id`, `:idChamado`, etc.)
 *        a partir dos grupos de captura da regex compilada;
 *     b. extrai a query string como um objeto plano
 *        `Record<string, string>`;
 *     c. delega para o manipulador (metodo do Controller), passando
 *        `req`, `res` e o contexto (`{ parametros, busca }`);
 *  4. se nenhuma rota casar, responde 404 com JSON.
 *
 * Decisoes de projeto:
 *  - Sem framework: usamos so o `http` nativo. O unico tratamento
 *    transversal aqui e o CORS (cabecalhos + resposta ao preflight
 *    OPTIONS), aplicado a toda requisicao antes do roteamento. Cada
 *    Controller cuida dos proprios erros (try/catch + `responderErro`).
 *  - Isolar o dispatcher em `app.ts` (e nao em `server.ts`) facilita
 *    testes (basta importar `criarManipulador` e simular req/res) e
 *    deixa `server.ts` focado em configuracao do processo.
 *
 * Camada na arquitetura: este e o "router" da aplicacao, abaixo do
 * server e acima dos Controllers. Nao executa logica de negocio.
 */
import type { IncomingMessage, ServerResponse } from "http";
import { listarRotas } from "./routes/index";
import { responder } from "./utils/http";

/**
 * Origem (protocolo + host + porta) do frontend autorizada a chamar esta
 * API pelo navegador. Vem da variavel de ambiente `ORIGEM_FRONTEND`; o
 * padrao e o endereco do Next.js em desenvolvimento (`localhost:3000`).
 */
const ORIGEM_FRONTEND = process.env.ORIGEM_FRONTEND ?? "http://localhost:3000";

/**
 * Constroi o manipulador HTTP da aplicacao.
 *
 * A funcao retornada e o que `http.createServer` espera como argumento.
 * As rotas sao compiladas uma unica vez na chamada de `listarRotas()`
 * (durante o startup) e reutilizadas em todas as requisicoes, sem custo
 * de compilacao por request.
 *
 * @returns funcao assincrona `(req, res) => Promise<void>` que serve
 *          uma requisicao HTTP - encontra a rota, extrai contexto e
 *          delega ao Controller, ou responde 404 se nao houver match.
 */
export function criarManipulador() {
  const rotas = listarRotas();

  return async (req: IncomingMessage, res: ServerResponse) => {
    // CORS: o navegador so deixa o frontend (outra origem/porta) chamar
    // esta API se a resposta trouxer estes cabecalhos de autorizacao.
    res.setHeader("Access-Control-Allow-Origin", ORIGEM_FRONTEND);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Usuario-Id, X-Usuario-Papel",
    );

    // "Preflight": antes de um POST/PATCH com JSON, o navegador manda um
    // OPTIONS perguntando se a chamada e permitida. Respondemos 204 (sem
    // corpo), ja com os cabecalhos acima, e encerramos aqui.
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // `req.url` so contem path + query (sem host); o construtor de
    // `URL` exige um base, entao passamos um arbitrario. O host nao
    // influencia o resultado final - so usamos `pathname` e `searchParams`.
    const url = new URL(req.url ?? "/", "http://localhost");

    for (const rota of rotas) {
      // Filtro inicial por verbo HTTP: evita rodar regex em rotas que
      // nem se aplicam ao metodo da requisicao corrente.
      if (rota.metodo !== req.method) continue;

      // `regex.exec` devolve um array com os grupos de captura nos
      // indices 1..n quando casa, ou `null` quando nao casa.
      const m = rota.regex.exec(url.pathname);
      if (!m) continue;

      // Reconstroi os parametros nomeados a partir dos grupos posicionais.
      // `rota.nomesParametros[i]` e o nome registrado no momento da
      // compilacao da rota (ver `compilar` em routes/index.ts); `m[i+1]`
      // e o valor capturado da URL (o indice 0 e o match completo).
      const parametros: Record<string, string> = {};
      rota.nomesParametros.forEach((nome, i) => {
        parametros[nome] = m[i + 1];
      });

      // `URLSearchParams` ja entrega pares chave/valor.
      // `Object.fromEntries` colapsa em um objeto plano. Se a mesma chave
      // aparecer mais de uma vez na query, fica apenas o ultimo valor -
      // suficiente para o nivel de filtros previstos.
      const busca = Object.fromEntries(url.searchParams);

      return rota.manipulador(req, res, { parametros, busca });
    }

    // Nenhuma rota casou: responde 404 JSON, consistente com o restante
    // da API (que sempre devolve JSON, nunca HTML).
    responder(res, 404, { erro: "Rota nao encontrada." });
  };
}
