/**
 * Mapa de URL para metodo de Controller.
 *
 * Nesta etapa, todos os endpoints respondem 501 (Service pendente).
 * Apenas a validacao de entrada esta ativa nos endpoints que recebem
 * corpo de requisicao.
 */
import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { ChamadosController } from "../controllers/ChamadosController";
import { ComentariosController } from "../controllers/ComentariosController";

export function registrarRotas(): Router {
  const roteador = Router();

  const auth = new AuthController();
  const chamados = new ChamadosController();
  const comentarios = new ComentariosController();

  // Autenticacao
  roteador.post("/auth/login", auth.login);
  roteador.post("/auth/logout", auth.logout);
  roteador.get("/auth/me", auth.me);

  // Chamados
  roteador.post("/chamados", chamados.abrir);
  roteador.get("/chamados", chamados.listar);
  roteador.get("/chamados/:id", chamados.detalhar);
  roteador.post("/chamados/:id/assumir", chamados.assumir);
  roteador.post("/chamados/:id/concluir", chamados.concluir);
  roteador.post("/chamados/:id/reabrir", chamados.reabrir);
  roteador.patch("/chamados/:id/atribuir", chamados.reatribuir);
  roteador.patch("/chamados/:id/prioridade", chamados.alterarPrioridade);

  // Comentarios (rotas aninhadas em chamados)
  roteador.post(
    "/chamados/:idChamado/comentarios",
    comentarios.adicionar,
  );
  roteador.get("/chamados/:idChamado/comentarios", comentarios.listar);

  return roteador;
}
