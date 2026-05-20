/**
 * Controller de autenticacao.
 *
 * Endpoints:
 *  - POST /api/auth/login   autentica e devolve token + usuario
 *  - POST /api/auth/logout  encerra a sessao
 *  - GET  /api/auth/me      retorna o usuario da sessao atual
 *
 * Nao contem regra de negocio. A validacao de credenciais e a emissao
 * do token sao responsabilidade do IAuthService.
 */
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { IAuthService } from "../services/IAuthService";
import { ErroDeAutenticacao } from "../lib/erros";
import { exigirUsuarioAutenticado } from "../lib/contexto";

const esquemaLogin = z.object({
  email: z.string().email("E-mail invalido."),
  senha: z.string().min(1, "Senha obrigatoria."),
});

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, senha } = esquemaLogin.parse(req.body);
      const resultado = await this.authService.login(email, senha);
      res.status(200).json(resultado);
    } catch (erro) {
      next(erro);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cabecalho = req.header("Authorization");
      if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
        throw new ErroDeAutenticacao("Token ausente.");
      }
      const token = cabecalho.slice("Bearer ".length).trim();
      await this.authService.logout(token);
      res.status(204).send();
    } catch (erro) {
      next(erro);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = exigirUsuarioAutenticado(req);
      res.status(200).json({ usuario });
    } catch (erro) {
      next(erro);
    }
  };
}
