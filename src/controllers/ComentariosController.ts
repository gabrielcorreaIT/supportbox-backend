/**
 * Controller de comentarios.
 *
 * Endpoints (aninhados em chamados):
 *  - POST /api/chamados/:idChamado/comentarios   adiciona um comentario
 *  - GET  /api/chamados/:idChamado/comentarios   lista comentarios
 *
 * Comentarios sao imutaveis (regra 5): nao existem endpoints de edicao
 * nem de exclusao. Nesta etapa, cada metodo apenas valida o formato da
 * entrada (quando aplicavel) e responde HTTP 501.
 */
import type { Request, Response } from "express";
import { z } from "zod";

const esquemaComentario = z.object({
  texto: z.string().trim().min(1, "Comentario nao pode estar vazio."),
});

export class ComentariosController {
  adicionar = async (req: Request, res: Response) => {
    const resultado = esquemaComentario.safeParse(req.body);
    if (!resultado.success) {
      return res.status(400).json({
        erro: "Dados invalidos.",
        detalhes: resultado.error.issues.map((i) => ({
          campo: i.path.join("."),
          mensagem: i.message,
        })),
      });
    }
    res
      .status(501)
      .json({ erro: "Service pendente: adicionar comentario." });
  };

  listar = async (_req: Request, res: Response) => {
    res.status(501).json({ erro: "Service pendente: listar comentarios." });
  };
}
