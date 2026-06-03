/**
 * Leitor de corpo de requisicao JSON.
 *
 * **Status atual:** este arquivo nao e importado por nenhum Controller no
 * estado simplificado atual (todos os Controllers respondem 501 sem ler
 * body). Mantido aqui para quando a camada de Service entrar - nesse
 * momento, os Controllers voltarao a ler e validar o corpo das
 * requisicoes, e este helper sera o ponto unico de leitura.
 *
 * A funcao acumula os chunks da stream de requisicao em uma string,
 * tenta fazer parse de JSON, e devolve um discriminated union
 * `ResultadoCorpo` em vez de lancar excecao. Isso deixa o Controller
 * com um codigo bem direto:
 *
 *     const corpo = await lerCorpoJson(req);
 *     if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });
 *     // ... usa `corpo.dados` ...
 *
 * Limitacoes conhecidas (a tratar quando o body voltar a ser usado):
 *  - sem limite de tamanho do payload (risco de DoS em producao);
 *  - acumula chunks como string via `bruto += pedaco`, o que faz
 *    coercao implicita de Buffer -> string e pode quebrar caracteres
 *    UTF-8 multibyte na borda entre chunks;
 *  - se o cliente abortar a requisicao antes do evento `end`, a Promise
 *    nao resolve - o handler fica pendurado ate o garbage collector.
 *
 * Posicao na arquitetura: utilitario de infraestrutura HTTP. Nao contem
 * logica de negocio - apenas le e parseia.
 */
import type { IncomingMessage } from "http";

/**
 * Resultado da leitura do corpo: ou os dados ja parseados, ou uma
 * mensagem de erro pronta para devolver ao cliente.
 *
 * Discriminated union: o campo `dados` so existe quando `ok` e `true`,
 * e o campo `erro` so existe quando `ok` e `false`. O TypeScript estreita
 * os tipos automaticamente quando o Controller faz `if (!corpo.ok) ...`,
 * o que evita acesso indevido a campos ausentes.
 */
export type ResultadoCorpo<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string };

/**
 * Le toda a stream da requisicao, decodifica para string, e tenta
 * parsear como JSON. **Sempre resolve** (nunca lanca excecao) - erros
 * sao convertidos para `{ ok: false, erro: "..." }`.
 *
 * Casos cobertos:
 *  - body vazio        -> resolve com `{ ok: true, dados: {} as T }`;
 *  - body JSON valido  -> resolve com `{ ok: true, dados: ... }`;
 *  - body JSON invalido -> resolve com erro descritivo;
 *  - erro de IO na stream -> resolve com erro generico.
 *
 * O tipo generico `T` e responsabilidade do chamador: este helper nao
 * valida o formato do JSON - apenas garante que e JSON valido. A
 * validacao de schema (ex.: com Zod, se voltar) deve acontecer no
 * Controller logo apos chamar esta funcao.
 *
 * @param req requisicao HTTP de onde o corpo sera lido
 * @returns Promise com o resultado parseado ou um erro descritivo
 */
export async function lerCorpoJson<T = unknown>(
  req: IncomingMessage,
): Promise<ResultadoCorpo<T>> {
  return new Promise((resolve) => {
    let bruto = "";

    // Cada chunk de dados que chega na stream e concatenado ao buffer
    // de texto. (Ver "Limitacoes" no header sobre coercao implicita.)
    req.on("data", (pedaco) => {
      bruto += pedaco;
    });

    // Quando a stream termina, tenta interpretar o que acumulou.
    req.on("end", () => {
      // Sem body: trata como objeto vazio. Isso facilita a vida dos
      // Controllers que tem schemas com todos os campos opcionais.
      if (!bruto) return resolve({ ok: true, dados: {} as T });
      try {
        resolve({ ok: true, dados: JSON.parse(bruto) as T });
      } catch {
        resolve({
          ok: false,
          erro: "JSON invalido no corpo da requisicao.",
        });
      }
    });

    // Erro de IO na propria stream (raro - conexao caiu, etc.).
    req.on("error", () => {
      resolve({ ok: false, erro: "Falha ao ler corpo da requisicao." });
    });
  });
}
