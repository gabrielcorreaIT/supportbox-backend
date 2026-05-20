/**
 * Mapa de URL para metodo de Controller.
 *
 * Esta funcao recebe as implementacoes dos Services como dependencias
 * (injecao de dependencias). Hoje, em `server.ts`, sao passadas as
 * versoes provisorias que respondem 501. Quando os Services reais
 * existirem, basta trocar a fonte em `server.ts` sem mexer aqui.
 */
import { Router } from "express";
import type { IAuthService } from "../services/IAuthService";
import type { IChamadosService } from "../services/IChamadosService";
import type { IComentariosService } from "../services/IComentariosService";
import { AuthController } from "../controllers/AuthController";
import { ChamadosController } from "../controllers/ChamadosController";
import { ComentariosController } from "../controllers/ComentariosController";
import { criarMiddlewareAutenticacao } from "../middlewares/autenticacao";

export interface DependenciasDasRotas {
  authService: IAuthService;
  chamadosService: IChamadosService;
  comentariosService: IComentariosService;
}

export function registrarRotas(deps: DependenciasDasRotas): Router {
  const roteador = Router();
  const exigirAuth = criarMiddlewareAutenticacao(deps.authService);

  const authController = new AuthController(deps.authService);
  const chamadosController = new ChamadosController(deps.chamadosService);
  const comentariosController = new ComentariosController(
    deps.comentariosService,
  );

  // Autenticacao (login e logout sao publicos; /me exige token)
  roteador.post("/auth/login", authController.login);
  roteador.post("/auth/logout", authController.logout);
  roteador.get("/auth/me", exigirAuth, authController.me);

  // Chamados (todos os endpoints exigem autenticacao)
  roteador.post("/chamados", exigirAuth, chamadosController.abrir);
  roteador.get("/chamados", exigirAuth, chamadosController.listar);
  roteador.get("/chamados/:id", exigirAuth, chamadosController.detalhar);
  roteador.post(
    "/chamados/:id/assumir",
    exigirAuth,
    chamadosController.assumir,
  );
  roteador.post(
    "/chamados/:id/concluir",
    exigirAuth,
    chamadosController.concluir,
  );
  roteador.post(
    "/chamados/:id/reabrir",
    exigirAuth,
    chamadosController.reabrir,
  );
  roteador.patch(
    "/chamados/:id/atribuir",
    exigirAuth,
    chamadosController.reatribuir,
  );
  roteador.patch(
    "/chamados/:id/prioridade",
    exigirAuth,
    chamadosController.alterarPrioridade,
  );

  // Comentarios (rotas aninhadas em chamados)
  roteador.post(
    "/chamados/:idChamado/comentarios",
    exigirAuth,
    comentariosController.adicionar,
  );
  roteador.get(
    "/chamados/:idChamado/comentarios",
    exigirAuth,
    comentariosController.listar,
  );

  return roteador;
}
