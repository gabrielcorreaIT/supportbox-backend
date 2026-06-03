/**
 * Utilitarios HTTP de baixo nivel.
 *
 * Este arquivo concentra:
 *  - os tipos `Contexto` e `Manipulador`, compartilhados entre o
 *    dispatcher e os Controllers (para que os dois lados conversem com
 *    tipagem forte);
 *  - o helper `responder`, que escreve uma resposta JSON na
 *    `ServerResponse` do Node sem depender de framework.
 *
 * Mantendo esses utilitarios separados, os Controllers ficam focados na
 * traducao requisicao -> regra de negocio -> resposta, sem se preocupar
 * com detalhes como `res.writeHead`, `Content-Type` ou parsing de
 * query string e path params (que ja chegam prontos via `Contexto`).
 *
 * Posicao na arquitetura: utilitarios de infraestrutura. Nao contem
 * logica de negocio nem estado mutavel.
 */
import type { IncomingMessage, ServerResponse } from "http";
import { ErroAcessoNegado, ErroNaoEncontrado, ErroValidacao } from "../erros";

/**
 * Conjunto de dados extraidos da URL que o dispatcher entrega ao
 * Controller, ja desempacotados e prontos para uso.
 *
 *  - `parametros`: pares chave/valor dos placeholders da rota.
 *    Exemplo: rota `/api/chamados/:id` casada contra `/api/chamados/42`
 *    resulta em `{ id: "42" }`. Sempre `Record<string, string>` - cabe
 *    ao Controller (ou ao Service) coagir para numero/UUID quando
 *    necessario.
 *
 *  - `busca`: pares chave/valor da query string.
 *    Exemplo: `?status=aberto&busca=teclado` resulta em
 *    `{ status: "aberto", busca: "teclado" }`. Tambem sempre strings.
 *    Se uma mesma chave aparecer multiplas vezes, fica apenas a ultima.
 */
export type Contexto = {
  parametros: Record<string, string>;
  busca: Record<string, string>;
};

/**
 * Assinatura de um Controller no formato esperado pelo dispatcher.
 *
 * Recebe:
 *  - `req`: a `IncomingMessage` original (util para ler o corpo, headers
 *    customizados, etc.);
 *  - `res`: a `ServerResponse` (para escrever a resposta - normalmente
 *    via o helper `responder`);
 *  - `ctx`: o `Contexto` ja desempacotado (path params + query).
 *
 * Pode ser sincrono ou assincrono. O dispatcher faz `await` no resultado,
 * entao retornar `Promise<void>` e perfeitamente seguro.
 */
export type Manipulador = (
  req: IncomingMessage,
  res: ServerResponse,
  ctx: Contexto,
) => Promise<void> | void;

/**
 * Escreve uma resposta JSON na `ServerResponse` e encerra a conexao.
 *
 * Comportamento:
 *  - define o status HTTP via `res.writeHead`;
 *  - seta o header `Content-Type: application/json; charset=utf-8`
 *    (charset explicito para acentos em mensagens passarem corretamente
 *    quando aplicavel);
 *  - serializa o `corpo` com `JSON.stringify` e finaliza a resposta
 *    via `res.end`.
 *
 * Importante: `responder` *finaliza* a resposta. Chama-lo duas vezes
 * para a mesma `res` causa o erro do Node "ERR_STREAM_WRITE_AFTER_END".
 * Sempre que o Controller for chamar `responder`, deve garantir que nao
 * escreveu nada antes na `res` e que nao tentara escrever depois.
 *
 * @param res    objeto de resposta do servidor HTTP nativo
 * @param status codigo HTTP da resposta (ex.: 200, 400, 404, 501)
 * @param corpo  payload que sera serializado em JSON e enviado
 */
export function responder(
  res: ServerResponse,
  status: number,
  corpo: unknown,
): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(corpo));
}

/**
 * Traduz um erro lancado pela camada de Service em uma resposta HTTP.
 *
 * Mapa de traducao (erro de dominio -> codigo HTTP):
 *  - `ErroValidacao`     -> 400 (pedido invalido / regra violada);
 *  - `ErroAcessoNegado`  -> 403 (sem permissao);
 *  - `ErroNaoEncontrado` -> 404 (recurso inexistente);
 *  - qualquer outro      -> 500 (erro inesperado; logado no servidor).
 *
 * Concentrar o mapeamento aqui deixa cada metodo de Controller com um
 * `catch` de uma linha so: `catch (e) { responderErro(res, e); }`.
 *
 * @param res  objeto de resposta do servidor HTTP nativo
 * @param erro o erro capturado (idealmente um erro de dominio de `erros.ts`)
 */
export function responderErro(res: ServerResponse, erro: unknown): void {
  if (erro instanceof ErroValidacao) {
    return responder(res, 400, { erro: erro.message });
  }
  if (erro instanceof ErroAcessoNegado) {
    return responder(res, 403, { erro: erro.message });
  }
  if (erro instanceof ErroNaoEncontrado) {
    return responder(res, 404, { erro: erro.message });
  }

  // Nao era um erro de dominio previsto: e um bug ou falha inesperada.
  // Logamos no servidor e devolvemos uma mensagem generica (sem vazar
  // detalhes internos para o cliente).
  console.error("Erro inesperado:", erro);
  return responder(res, 500, { erro: "Erro interno do servidor." });
}
