/**
 * Pequenos auxiliares para ler o contexto de uma requisicao HTTP.
 *
 * O middleware de autenticacao garante em tempo de execucao que
 * `req.usuario` esta preenchido nas rotas protegidas. Esta funcao
 * espelha essa garantia em tempo de tipo, evitando que cada Controller
 * precise repetir o `if (!req.usuario)`.
 */
import type { Request } from "express";
import type { Usuario } from "../types/dominio";
import { ErroDeAutenticacao } from "./erros";

export function exigirUsuarioAutenticado(req: Request): Usuario {
  if (!req.usuario) throw new ErroDeAutenticacao();
  return req.usuario;
}
