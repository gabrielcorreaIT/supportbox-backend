/**
 * Controller de comentarios.
 *
 * Endpoints (aninhados em chamados):
 *  - POST /api/chamados/:idChamado/comentarios   adiciona um comentario
 *  - GET  /api/chamados/:idChamado/comentarios   lista comentarios
 *
 * Comentarios sao imutaveis (regra 5): nao existem endpoints de edicao
 * nem de exclusao.
 */
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { IComentariosService } from "../services/IComentariosService";
import { exigirUsuarioAutenticado } from "../lib/contexto";

const esquemaComentario = z.object({
  texto: z.string().trim().min(1, "Comentario nao pode estar vazio."),
});

export class ComentariosController {
  constructor(private readonly comentariosService: IComentariosService) {}

  adicionar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      const { texto } = esquemaComentario.parse(req.body);
      const comentario = await this.comentariosService.adicionar(
        usuario,
        req.params.idChamado,
        texto,
      );
      res.status(201).json(comentario);
    } catch (erro) {
      next(erro);
    }
  };

  listar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      const comentarios = await this.comentariosService.listarPorChamado(
        usuario,
        req.params.idChamado,
      );
      res.status(200).json(comentarios);
    } catch (erro) {
      next(erro);
    }
  };
}
