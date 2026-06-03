/**
 * Controller de comentarios de chamados.
 *
 * Posicao na arquitetura: camada HTTP. Comentarios pertencem a um chamado
 * (relacao 1:N), por isso as rotas sao aninhadas em
 * `/chamados/:idChamado/comentarios`. Cada metodo descobre o ator,
 * (quando ha corpo) le o JSON, delega ao `ComentariosService` num
 * try/catch e responde - com `responderErro` traduzindo os erros de regra.
 *
 * Decisao de design (regra 5): comentarios sao IMUTAVEIS. Nao existe
 * endpoint de edicao nem de exclusao, so adicionar e listar.
 *
 * Endpoints:
 *  - POST /api/chamados/:idChamado/comentarios   adiciona um comentario -> 201
 *  - GET  /api/chamados/:idChamado/comentarios   lista os comentarios   -> 200
 */
import type { IncomingMessage, ServerResponse } from "http";
import { responder, responderErro, type Contexto } from "../utils/http";
import { lerCorpoJson } from "../utils/corpo";
import { extrairAtor } from "../utils/ator";
import { ComentariosService } from "../services/ComentariosService";

export class ComentariosController {
  private service = new ComentariosService();

  /**
   * POST /api/chamados/:idChamado/comentarios - adiciona um comentario.
   * Body: `{ texto }`. Responde 201 com o comentario criado; 403 se o ator
   * nao puder comentar; 404 se o chamado nao existir.
   */
  adicionar = async (
    req: IncomingMessage,
    res: ServerResponse,
    ctx: Contexto,
  ) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    const corpo = await lerCorpoJson<{ texto?: unknown }>(req);
    if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });

    try {
      const comentario = this.service.adicionar(
        ctx.parametros.idChamado,
        ator,
        corpo.dados.texto,
      );
      responder(res, 201, comentario);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  /**
   * GET /api/chamados/:idChamado/comentarios - lista os comentarios do
   * chamado, em ordem cronologica. Responde 200 com `{ itens: [...] }`.
   */
  listar = (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const itens = this.service.listar(ctx.parametros.idChamado, ator);
      responder(res, 200, { itens });
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
