/**
 * Contrato do servico de comentarios.
 *
 * Comentarios sao imutaveis por regra de negocio (regra 5): nao existe
 * metodo para editar nem excluir. Quem decide se um usuario pode
 * comentar em um chamado e o Service, nao o Controller.
 */
import type { Comentario, Usuario } from "../types/dominio";

export interface IComentariosService {
  /** Regra 5 - apenas solicitante do chamado e agente atribuido podem comentar. */
  adicionar(
    autor: Usuario,
    idChamado: string,
    texto: string,
  ): Promise<Comentario>;

  /** Lista comentarios de um chamado em ordem cronologica. */
  listarPorChamado(usuario: Usuario, idChamado: string): Promise<Comentario[]>;
}
