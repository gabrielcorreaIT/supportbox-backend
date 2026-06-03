/**
 * Controller de autenticacao.
 *
 * Posicao na arquitetura: este e o Controller HTTP do dominio de
 * autenticacao. Quando a Service Layer for criada, cada metodo aqui
 * vai delegar para `AuthService` (validacao de credenciais, geracao e
 * verificacao de token, etc.), que por sua vez consultara o DAO de
 * usuarios para a persistencia. Regra geral: Controller nao toca em
 * banco diretamente.
 *
 * Endpoints expostos (todos sob `/api/auth`):
 *  - POST /api/auth/login   recebe email + senha, abre uma sessao
 *  - POST /api/auth/logout  encerra a sessao corrente
 *  - GET  /api/auth/me      retorna os dados do usuario autenticado
 *
 * **Status atual:** continua respondendo HTTP 501. Diferente de Chamados e
 * Comentarios (ja ligados a Service e DAO), a Autenticacao ainda nao tem
 * regras de negocio definidas nem um `AuthService` - por isso fica para a
 * etapa de autenticacao. Enquanto isso, a identidade de quem chama a API e
 * resolvida de forma temporaria via cabecalhos (veja `utils/ator.ts`).
 */
import type { IncomingMessage, ServerResponse } from "http";
import { responder } from "../utils/http";

export class AuthController {
  /**
   * POST /api/auth/login
   *
   * Inicia uma sessao a partir de email + senha.
   *
   * Quando implementado, devera:
   *  1. ler o body JSON e validar o formato (email obrigatorio e bem
   *     formado; senha nao vazia);
   *  2. delegar para `AuthService.login(email, senha)`;
   *  3. responder 200 com `{ token, usuario }` em caso de sucesso, ou
   *     401 ("credenciais invalidas") / 400 ("dados invalidos").
   */
  login = (_req: IncomingMessage, res: ServerResponse) => {
    responder(res, 501, { erro: "Service pendente: login." });
  };

  /**
   * POST /api/auth/logout
   *
   * Encerra a sessao do usuario corrente.
   *
   * Quando implementado, devera invalidar o token/sessao no servidor
   * (lista de revogacao ou expiracao forcada no DAO de sessoes) e
   * responder 204 (No Content) ou 200 com confirmacao.
   */
  logout = (_req: IncomingMessage, res: ServerResponse) => {
    responder(res, 501, { erro: "Service pendente: logout." });
  };

  /**
   * GET /api/auth/me
   *
   * Retorna os dados do usuario autenticado.
   *
   * Quando implementado, devera:
   *  1. ler o token do header `Authorization: Bearer <token>`;
   *  2. validar o token via `AuthService.validar(token)`;
   *  3. responder 200 com `{ usuario }` ou 401 caso o token esteja
   *     invalido / expirado / ausente.
   */
  me = (_req: IncomingMessage, res: ServerResponse) => {
    responder(res, 501, { erro: "Service pendente: me." });
  };
}
