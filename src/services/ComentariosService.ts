/**
 * Service de comentarios.
 *
 * Posicao na arquitetura: faz parte do "Model" (que se divide em Service +
 * DAO). Aplica as regras de negocio dos comentarios; a persistencia fica
 * na DAO. Nao sabe nada de HTTP.
 *
 * Para validar suas regras, este Service precisa conhecer o chamado dono do
 * comentario, entao ele usa DUAS DAOs: a `ChamadosDAO` (para buscar o
 * chamado e checar permissao/visibilidade) e a `ComentariosDAO` (para
 * gravar e listar os comentarios).
 *
 * Regras cobertas (REGRAS_DE_NEGOCIO.md):
 *   - regra 5: so o solicitante do chamado e o agente atribuido podem
 *     comentar; comentarios sao imutaveis (por isso so ha `adicionar` e
 *     `listar`, nunca editar/apagar);
 *   - regra 3: quem nao pode ver o chamado tambem nao ve os comentarios.
 *
 * Em caso de violacao, lanca um erro de dominio (ErroNaoEncontrado /
 * ErroAcessoNegado / ErroValidacao), que a camada HTTP traduz no status.
 */
import type { Ator, Comentario } from "../dominio";
import { ChamadosDAO } from "../dao/ChamadosDAO";
import { ComentariosDAO } from "../dao/ComentariosDAO";
import { ErroAcessoNegado, ErroNaoEncontrado, ErroValidacao } from "../erros";

/**
 * Converte um valor desconhecido (vindo do corpo) em texto limpo: se nao
 * for string vira "", se for remove os espacos das pontas.
 */
function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

export class ComentariosService {
  /**
   * @param chamadosDao    para buscar o chamado dono do comentario
   * @param comentariosDao para gravar e listar comentarios
   *
   * Ambas recebidas por parametro (com padrao) para facilitar testes.
   */
  constructor(
    private chamadosDao: ChamadosDAO = new ChamadosDAO(),
    private comentariosDao: ComentariosDAO = new ComentariosDAO(),
  ) {}

  /**
   * Adiciona um comentario a um chamado e devolve o comentario criado.
   *
   * Regras (na ordem): o chamado precisa existir; so o solicitante do
   * chamado ou o agente atribuido podem comentar (regra 5, checagem de
   * IDENTIDADE - um agente que nao e o atribuido nao pode); o texto nao
   * pode ser vazio.
   *
   * @param idChamado id do chamado que recebera o comentario
   * @param ator      quem esta comentando
   * @param texto     conteudo do comentario (vem do corpo: `unknown`)
   */
  adicionar(idChamado: string, ator: Ator, texto: unknown): Comentario {
    const chamado = this.chamadosDao.buscarPorId(idChamado);
    if (!chamado) {
      throw new ErroNaoEncontrado("Chamado nao encontrado.");
    }

    const ehSolicitante = ator.id === chamado.solicitanteId;
    const ehAgenteAtribuido = ator.id === chamado.agenteId;
    if (!ehSolicitante && !ehAgenteAtribuido) {
      throw new ErroAcessoNegado(
        "Apenas o solicitante do chamado e o agente atribuido podem comentar.",
      );
    }

    const conteudo = comoTexto(texto);
    if (conteudo.length === 0) {
      throw new ErroValidacao("O comentario nao pode estar vazio.");
    }

    return this.comentariosDao.criar({
      chamadoId: idChamado,
      autor: ator.id,
      texto: conteudo,
    });
  }

  /**
   * Lista os comentarios de um chamado, em ordem cronologica.
   *
   * Regra 3 (visibilidade): o chamado precisa existir e, se o ator for
   * solicitante, ele so ve os comentarios dos chamados que abriu.
   *
   * @param idChamado id do chamado cujos comentarios serao lidos
   * @param ator      quem esta consultando
   */
  listar(idChamado: string, ator: Ator): Comentario[] {
    const chamado = this.chamadosDao.buscarPorId(idChamado);
    if (!chamado) {
      throw new ErroNaoEncontrado("Chamado nao encontrado.");
    }

    if (ator.papel === "solicitante" && chamado.solicitanteId !== ator.id) {
      throw new ErroAcessoNegado("Voce nao tem acesso a este chamado.");
    }

    return this.comentariosDao.listarPorChamado(idChamado);
  }
}
