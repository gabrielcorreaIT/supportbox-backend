/**
 * Controller de chamados (tickets de suporte).
 *
 * Posicao na arquitetura: camada HTTP. Cada metodo aqui faz sempre o mesmo
 * roteiro:
 *   1. descobre quem esta agindo (`extrairAtor`) - se nao der, responde 401;
 *   2. quando ha corpo, le e parseia o JSON (`lerCorpoJson`) - se for
 *      invalido, responde 400;
 *   3. delega para o `ChamadosService` (que aplica as regras e fala com a
 *      DAO), dentro de um try/catch;
 *   4. em caso de sucesso, responde com o resultado; em caso de erro de
 *      regra, `responderErro` traduz para o status HTTP certo.
 *
 * O Controller NAO decide regra de negocio nem toca no banco - so traduz
 * HTTP <-> Service.
 *
 * Endpoints (todos sob `/api/chamados`):
 *  - POST   /                  abrir um chamado novo          -> 201
 *  - GET    /                  listar chamados (com filtros)  -> 200
 *  - GET    /:id               detalhar um chamado            -> 200
 *  - POST   /:id/assumir       agente assume para si          -> 200
 *  - POST   /:id/concluir      agente atribuido conclui       -> 200
 *  - POST   /:id/reabrir       solicitante reabre (ate 7d)    -> 200
 *  - PATCH  /:id/atribuir      reatribuir para outro agente   -> 200
 *  - PATCH  /:id/prioridade    alterar prioridade             -> 200
 */
import type { IncomingMessage, ServerResponse } from "http";
import { responder, responderErro, type Contexto } from "../utils/http";
import { lerCorpoJson } from "../utils/corpo";
import { extrairAtor } from "../utils/ator";
import {
  ChamadosService,
  type DadosAbrirChamado,
} from "../services/ChamadosService";

export class ChamadosController {
  private service = new ChamadosService();

  /**
   * POST /api/chamados - abre um chamado novo. Responde 201 com o chamado
   * criado (ja com id, protocolo e datas), ou 400 se os dados forem
   * invalidos.
   */
  abrir = async (req: IncomingMessage, res: ServerResponse) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    const corpo = await lerCorpoJson<DadosAbrirChamado>(req);
    if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });

    try {
      const chamado = this.service.abrir(ator, corpo.dados);
      responder(res, 201, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  /**
   * GET /api/chamados - lista os chamados visiveis para o ator, com filtro
   * opcional `?status=`. Responde 200 com `{ itens: [...] }`.
   */
  listar = (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const itens = this.service.listar(ator, { status: ctx.busca.status });
      responder(res, 200, { itens });
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  /**
   * GET /api/chamados/:id - detalha um chamado. Responde 200 com o chamado,
   * 403 se o ator nao puder ve-lo, ou 404 se nao existir.
   */
  detalhar = (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const chamado = this.service.detalhar(ctx.parametros.id, ator);
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  /**
   * POST /api/chamados/:id/assumir - agente assume o chamado. Responde 200
   * com o chamado atualizado.
   */
  assumir = (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const chamado = this.service.assumir(ctx.parametros.id, ator);
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  /**
   * POST /api/chamados/:id/concluir - agente atribuido conclui o chamado.
   * Responde 200 com o chamado atualizado.
   */
  concluir = (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const chamado = this.service.concluir(ctx.parametros.id, ator);
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  /**
   * POST /api/chamados/:id/reabrir - solicitante reabre o chamado (ate 7
   * dias apos a conclusao). Responde 200 com o chamado atualizado.
   */
  reabrir = (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const chamado = this.service.reabrir(ctx.parametros.id, ator);
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  /**
   * PATCH /api/chamados/:id/atribuir - reatribui o chamado para outro
   * agente. Body: `{ agenteId }`. Responde 200 com o chamado atualizado.
   */
  reatribuir = async (
    req: IncomingMessage,
    res: ServerResponse,
    ctx: Contexto,
  ) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    const corpo = await lerCorpoJson<{ agenteId?: unknown }>(req);
    if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });

    try {
      const chamado = this.service.reatribuir(
        ctx.parametros.id,
        ator,
        corpo.dados.agenteId,
      );
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  /**
   * PATCH /api/chamados/:id/prioridade - altera a prioridade. Body:
   * `{ prioridade }` em baixa|media|alta. Responde 200 com o chamado.
   */
  alterarPrioridade = async (
    req: IncomingMessage,
    res: ServerResponse,
    ctx: Contexto,
  ) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    const corpo = await lerCorpoJson<{ prioridade?: unknown }>(req);
    if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });

    try {
      const chamado = this.service.alterarPrioridade(
        ctx.parametros.id,
        ator,
        corpo.dados.prioridade,
      );
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
