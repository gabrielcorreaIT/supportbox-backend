/**
 * Controller de chamados.
 *
 * Endpoints:
 *  - POST   /api/chamados                  abrir
 *  - GET    /api/chamados                  listar
 *  - GET    /api/chamados/:id              detalhar
 *  - POST   /api/chamados/:id/assumir      agente assume
 *  - POST   /api/chamados/:id/concluir     agente atribuido conclui
 *  - POST   /api/chamados/:id/reabrir      solicitante reabre (ate 7 dias)
 *  - PATCH  /api/chamados/:id/atribuir     reatribuir a outro agente
 *  - PATCH  /api/chamados/:id/prioridade   alterar prioridade
 *
 * Nenhuma decisao de negocio (quem pode fazer o que, em que estado,
 * dentro de qual prazo) e tomada aqui. O Controller valida o formato
 * da entrada com zod e delega ao IChamadosService.
 */
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { IChamadosService } from "../services/IChamadosService";
import { exigirUsuarioAutenticado } from "../lib/contexto";

const esquemaAbertura = z.object({
  titulo: z.string().trim().min(5, "Titulo precisa ter ao menos 5 caracteres."),
  descricao: z
    .string()
    .trim()
    .min(20, "Descricao precisa ter ao menos 20 caracteres."),
  categoria: z.enum(["hardware", "software", "acesso", "rede"]),
  tipo: z.enum(["incidente", "solicitacao"]),
});

const esquemaListagem = z.object({
  status: z.enum(["aberto", "em_andamento", "concluido"]).optional(),
  busca: z.string().trim().optional(),
});

const esquemaPrioridade = z.object({
  prioridade: z.enum(["baixa", "media", "alta"]),
});

const esquemaAtribuicao = z.object({
  agenteId: z.string().min(1, "Identificador do agente obrigatorio."),
});

export class ChamadosController {
  constructor(private readonly chamadosService: IChamadosService) {}

  abrir = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      const dados = esquemaAbertura.parse(req.body);
      const chamado = await this.chamadosService.abrir(usuario, dados);
      res.status(201).json(chamado);
    } catch (erro) {
      next(erro);
    }
  };

  listar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      const filtros = esquemaListagem.parse(req.query);
      const chamados = await this.chamadosService.listar(usuario, filtros);
      res.status(200).json(chamados);
    } catch (erro) {
      next(erro);
    }
  };

  detalhar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      const chamado = await this.chamadosService.obterPorId(
        usuario,
        req.params.id,
      );
      res.status(200).json(chamado);
    } catch (erro) {
      next(erro);
    }
  };

  assumir = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      const chamado = await this.chamadosService.assumir(
        usuario,
        req.params.id,
      );
      res.status(200).json(chamado);
    } catch (erro) {
      next(erro);
    }
  };

  concluir = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      const chamado = await this.chamadosService.concluir(
        usuario,
        req.params.id,
      );
      res.status(200).json(chamado);
    } catch (erro) {
      next(erro);
    }
  };

  reabrir = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      const chamado = await this.chamadosService.reabrir(
        usuario,
        req.params.id,
      );
      res.status(200).json(chamado);
    } catch (erro) {
      next(erro);
    }
  };

  reatribuir = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      const { agenteId } = esquemaAtribuicao.parse(req.body);
      const chamado = await this.chamadosService.reatribuir(
        usuario,
        req.params.id,
        agenteId,
      );
      res.status(200).json(chamado);
    } catch (erro) {
      next(erro);
    }
  };

  alterarPrioridade = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      const { prioridade } = esquemaPrioridade.parse(req.body);
      const chamado = await this.chamadosService.alterarPrioridade(
        usuario,
        req.params.id,
        prioridade,
      );
      res.status(200).json(chamado);
    } catch (erro) {
      next(erro);
    }
  };
}
