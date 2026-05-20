/**
 * Middleware de autenticacao.
 *
 * Le o token do header `Authorization: Bearer <token>`, pede ao
 * IAuthService que resolva o usuario dono do token e anexa o resultado
 * em `req.usuario`, deixando-o disponivel para os Controllers.
 *
 * Enquanto o IAuthService nao for implementado, este middleware vai
 * encaminhar um ErroNaoImplementado para o tratadorDeErros, que
 * respondera 501. E o comportamento esperado para esta etapa.
 */
import type { NextFunction, Request, Response } from "express";
import type { IAuthService } from "../services/IAuthService";
import type { Usuario } from "../types/dominio";
import { ErroDeAutenticacao } from "../lib/erros";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}

export function criarMiddlewareAutenticacao(authService: IAuthService) {
  return async function autenticar(
    req: Request,
    _res: Response,
    next: NextFunction,
  ) {
    try {
      const cabecalho = req.header("Authorization");
      if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
        throw new ErroDeAutenticacao("Token de autenticacao ausente.");
      }
      const token = cabecalho.slice("Bearer ".length).trim();
      req.usuario = await authService.obterUsuarioDoToken(token);
      next();
    } catch (erro) {
      next(erro);
    }
  };
}
