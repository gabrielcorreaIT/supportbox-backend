/**
 * DAO de comentarios (camada de persistencia).
 *
 * Mesma ideia da ChamadosDAO: guarda e recupera dados, e so isso. Nao
 * conhece regra de negocio (Service) nem HTTP (Controller).
 *
 * A "tabela" de comentarios e um `Map` em memoria, indexado por `id`.
 * Valem as mesmas observacoes da ChamadosDAO: os dados vivem so na RAM e
 * somem quando o servidor reinicia; trocar por um banco real (Supabase)
 * sera uma mudanca local aqui dentro, sem afetar Service nem Controller.
 *
 * Operacoes: criar (`criar`) e ler (`listarPorChamado`). NAO existe
 * atualizar nem apagar, de proposito: comentarios sao IMUTAVEIS
 * (REGRAS_DE_NEGOCIO, regra 5) - uma vez salvos, nunca mudam.
 */
import { randomUUID } from "crypto";
import type { Comentario } from "../dominio";

/**
 * Dados que o chamador entrega para CRIAR um comentario. O `id` e a data
 * de criacao sao preenchidos pela propria DAO (veja `criar`).
 *
 *  - `chamadoId`: a qual chamado o comentario pertence.
 *  - `autor`:     id do usuario autor, ou "Sistema" para os comentarios
 *                 automaticos (regra 5). A DAO nao decide quem e o autor -
 *                 so guarda o que o Service mandar.
 *  - `texto`:     conteudo do comentario.
 */
export type DadosCriarComentario = {
  chamadoId: string;
  autor: string;
  texto: string;
};

/**
 * A "tabela" de comentarios em memoria, indexada por `id`. Fica no escopo
 * do modulo de proposito: uma unica tabela compartilhada por todo o
 * processo (veja a explicacao equivalente na ChamadosDAO).
 */
const tabelaComentarios = new Map<string, Comentario>();

export class ComentariosDAO {
  /**
   * Grava um comentario novo e devolve o registro completo.
   *
   * @param dados conteudo do comentario (ja validado pelo Service)
   * @returns o comentario recem-criado, completo
   */
  criar(dados: DadosCriarComentario): Comentario {
    const comentario: Comentario = {
      id: randomUUID(),
      chamadoId: dados.chamadoId,
      autor: dados.autor,
      texto: dados.texto,
      criadoEm: new Date(),
    };

    tabelaComentarios.set(comentario.id, comentario);

    // Devolve uma copia, pelo mesmo motivo da ChamadosDAO: o chamador nao
    // mexe no registro guardado por engano.
    return { ...comentario };
  }

  /**
   * Lista os comentarios de um chamado, em ordem cronologica (do mais
   * antigo para o mais novo).
   *
   * A ordenacao por data e uma preocupacao de consulta (como um ORDER BY
   * no banco), nao uma regra de negocio.
   *
   * @param chamadoId id do chamado cujos comentarios serao buscados
   * @returns array com copias dos comentarios daquele chamado
   */
  listarPorChamado(chamadoId: string): Comentario[] {
    return [...tabelaComentarios.values()]
      .filter((comentario) => comentario.chamadoId === chamadoId)
      .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())
      .map((comentario) => ({ ...comentario }));
  }
}
