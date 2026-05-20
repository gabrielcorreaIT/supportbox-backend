/**
 * Middleware central de tratamento de erros.
 *
 * Captura erros lancados em qualquer Controller ou Service, identifica
 * o tipo e devolve uma resposta HTTP coerente. Mantem os Controllers
 * livres de blocos try/catch espalhados e centraliza o formato das
 * respostas de erro.
 *
 * E o ultimo middleware registrado no app, conforme exige o Express.
 */
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ErroDoDominio } from "../lib/erros";

export function tratadorDeErros(
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (erro instanceof ZodError) {
    return res.status(400).json({
      erro: "Dados invalidos.",
      detalhes: erro.issues.map((i) => ({
        campo: i.path.join("."),
        mensagem: i.message,
      })),
    });
  }

  if (erro instanceof ErroDoDominio) {
    return res.status(erro.status).json({ erro: erro.mensagem });
  }

  console.error("[erro inesperado]", erro);
  return res.status(500).json({ erro: "Erro interno do servidor." });
}
