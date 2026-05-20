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
 * Nesta etapa, cada metodo apenas valida o formato da entrada (com
 * zod, quando aplicavel) e responde HTTP 501. As regras de negocio
 * descritas em REGRAS_DE_NEGOCIO.md serao aplicadas pela camada de
 * Service na proxima etapa.
 */
import type { Request, Response } from "express";
import { z, type ZodIssue } from "zod";

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

function responderInvalido(res: Response, issues: ZodIssue[]) {
  return res.status(400).json({
    erro: "Dados invalidos.",
    detalhes: issues.map((i) => ({
      campo: i.path.join("."),
      mensagem: i.message,
    })),
  });
}

export class ChamadosController {
  abrir = async (req: Request, res: Response) => {
    const r = esquemaAbertura.safeParse(req.body);
    if (!r.success) return responderInvalido(res, r.error.issues);
    res.status(501).json({ erro: "Service pendente: abrir chamado." });
  };

  listar = async (req: Request, res: Response) => {
    const r = esquemaListagem.safeParse(req.query);
    if (!r.success) return responderInvalido(res, r.error.issues);
    res.status(501).json({ erro: "Service pendente: listar chamados." });
  };

  detalhar = async (_req: Request, res: Response) => {
    res.status(501).json({ erro: "Service pendente: detalhar chamado." });
  };

  assumir = async (_req: Request, res: Response) => {
    res.status(501).json({ erro: "Service pendente: assumir chamado." });
  };

  concluir = async (_req: Request, res: Response) => {
    res.status(501).json({ erro: "Service pendente: concluir chamado." });
  };

  reabrir = async (_req: Request, res: Response) => {
    res.status(501).json({ erro: "Service pendente: reabrir chamado." });
  };

  reatribuir = async (req: Request, res: Response) => {
    const r = esquemaAtribuicao.safeParse(req.body);
    if (!r.success) return responderInvalido(res, r.error.issues);
    res.status(501).json({ erro: "Service pendente: reatribuir chamado." });
  };

  alterarPrioridade = async (req: Request, res: Response) => {
    const r = esquemaPrioridade.safeParse(req.body);
    if (!r.success) return responderInvalido(res, r.error.issues);
    res.status(501).json({ erro: "Service pendente: alterar prioridade." });
  };
}
