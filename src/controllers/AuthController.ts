/**
 * Controller de autenticacao.
 *
 * Endpoints:
 *  - POST /api/auth/login   valida e-mail e senha; logica entra na proxima etapa
 *  - POST /api/auth/logout  encerra a sessao
 *  - GET  /api/auth/me      retorna o usuario da sessao atual
 *
 * Nesta etapa, cada metodo apenas valida o formato da entrada (com
 * zod, quando aplicavel) e responde HTTP 501. A integracao com a
 * camada de Service entra na proxima etapa.
 */
import type { Request, Response } from "express";
import { z } from "zod";

const esquemaLogin = z.object({
  email: z.string().email("E-mail invalido."),
  senha: z.string().min(1, "Senha obrigatoria."),
});

export class AuthController {
  login = async (req: Request, res: Response) => {
    const resultado = esquemaLogin.safeParse(req.body);
    if (!resultado.success) {
      return res.status(400).json({
        erro: "Dados invalidos.",
        detalhes: resultado.error.issues.map((i) => ({
          campo: i.path.join("."),
          mensagem: i.message,
        })),
      });
    }
    res.status(501).json({ erro: "Service pendente: login." });
  };

  logout = async (_req: Request, res: Response) => {
    res.status(501).json({ erro: "Service pendente: logout." });
  };

  me = async (_req: Request, res: Response) => {
    res.status(501).json({ erro: "Service pendente: me." });
  };
}
