/**
 * Implementacoes provisorias dos Services para esta etapa do projeto.
 *
 * Cada metodo lanca ErroNaoImplementado. Como resultado, qualquer
 * endpoint protegido respondera HTTP 501. Isso permite que a aplicacao
 * suba e que o roteamento + validacao + tratamento de erros sejam
 * testados sem termos ainda a implementacao real dos Services.
 *
 * Na proxima etapa, estas constantes serao substituidas pelas classes
 * concretas (AuthService, ChamadosService, ComentariosService) no
 * arquivo `server.ts`.
 */
import type { IAuthService } from "../services/IAuthService";
import type { IChamadosService } from "../services/IChamadosService";
import type { IComentariosService } from "../services/IComentariosService";
import { ErroNaoImplementado } from "./erros";

function naoImplementado(acao: string): never {
  throw new ErroNaoImplementado(`Service pendente: ${acao}.`);
}

export const authServicePendente: IAuthService = {
  login: async () => naoImplementado("login"),
  logout: async () => naoImplementado("logout"),
  obterUsuarioDoToken: async () => naoImplementado("obterUsuarioDoToken"),
};

export const chamadosServicePendente: IChamadosService = {
  abrir: async () => naoImplementado("abrir chamado"),
  listar: async () => naoImplementado("listar chamados"),
  obterPorId: async () => naoImplementado("obter chamado"),
  assumir: async () => naoImplementado("assumir chamado"),
  concluir: async () => naoImplementado("concluir chamado"),
  reabrir: async () => naoImplementado("reabrir chamado"),
  reatribuir: async () => naoImplementado("reatribuir chamado"),
  alterarPrioridade: async () => naoImplementado("alterar prioridade"),
};

export const comentariosServicePendente: IComentariosService = {
  adicionar: async () => naoImplementado("adicionar comentario"),
  listarPorChamado: async () => naoImplementado("listar comentarios"),
};
