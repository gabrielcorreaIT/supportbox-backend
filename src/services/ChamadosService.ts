/**
 * Service de chamados.
 *
 * Posicao na arquitetura:
 *
 *     Controller   (camada HTTP)
 *         |
 *         v
 *     Service      <-- voce esta aqui (regras de negocio)
 *         |
 *         v
 *      DAO         (persistencia)
 *
 * Nota de nomenclatura: no padrao MVC, o "Model" deste projeto se divide
 * em Service (este arquivo) e DAO. Nao existe um arquivo "Model".
 *
 * Responsabilidade: aplicar as REGRAS_DE_NEGOCIO.md (quem pode, quando
 * pode, quais transicoes de estado sao validas) e, quando tudo confere,
 * pedir a persistencia para a DAO. O Service NAO sabe nada de HTTP nem de
 * banco.
 *
 * Como ele conversa com a DAO: o Service recebe IDS (nao objetos prontos),
 * busca o estado atual pela DAO, valida, aplica a mudanca no objeto e manda
 * de volta para a DAO gravar. Quando uma regra e violada, ele lanca um erro
 * de dominio (ErroValidacao / ErroAcessoNegado / ErroNaoEncontrado); a
 * camada HTTP traduz esse erro no status certo (veja `responderErro`).
 *
 * Pendente (parte da regra 5): registrar comentarios automaticos do autor
 * "Sistema" a cada mudanca de status/atribuicao/prioridade. Ficou para um
 * passo separado, para nao misturar coisas demais de uma vez.
 */
import type { Ator, Chamado, Prioridade } from "../dominio";
import { ChamadosDAO } from "../dao/ChamadosDAO";
import { ErroAcessoNegado, ErroNaoEncontrado, ErroValidacao } from "../erros";

/**
 * Dados que o Controller entrega ao Service para abrir um chamado. O
 * conteudo (tamanho minimo, valores validos) e validado em `abrir`.
 */
export type DadosAbrirChamado = {
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: string;
};

/** Categorias validas (regra 4); comparadas em minusculas. */
const CATEGORIAS_VALIDAS = ["hardware", "software", "acesso", "rede"];

/** Tipos validos (regra 4); comparados em minusculas. */
const TIPOS_VALIDOS = ["incidente", "solicitacao"];

/** Prioridades validas (regra 4); comparadas em minusculas. */
const PRIORIDADES_VALIDAS: Prioridade[] = ["baixa", "media", "alta"];

/** Status validos (regra 1); usado no filtro opcional da listagem. */
const STATUS_VALIDOS = ["aberto", "em_andamento", "concluido"];

/**
 * Converte um valor desconhecido (vindo do corpo da requisicao) em texto
 * limpo: se nao for string, vira ""; se for, remove os espacos das pontas.
 * O Service nunca confia cegamente no formato do que recebe.
 */
function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

/**
 * Garante que o ator e um Agente (regras 2 e 3); lanca ErroAcessoNegado
 * caso contrario. Concentra a checagem usada por varias acoes.
 */
function exigirAgente(ator: Ator): void {
  if (ator.papel !== "agente") {
    throw new ErroAcessoNegado("Apenas um agente pode executar esta acao.");
  }
}

export class ChamadosService {
  /**
   * @param dao a DAO de chamados. Recebida por parametro (com um padrao)
   *            para facilitar testes - da para passar uma DAO falsa.
   */
  constructor(private dao: ChamadosDAO = new ChamadosDAO()) {}

  /**
   * Abre um chamado novo (regra 4) e devolve o chamado criado.
   *
   * Valida: titulo >= 5, descricao >= 20, categoria e tipo validos. O
   * solicitante do chamado passa a ser o proprio ator que esta abrindo.
   *
   * @param ator  quem esta abrindo o chamado
   * @param dados conteudo informado na abertura
   */
  abrir(ator: Ator, dados: DadosAbrirChamado): Chamado {
    const titulo = comoTexto(dados.titulo);
    const descricao = comoTexto(dados.descricao);
    const categoria = comoTexto(dados.categoria).toLowerCase();
    const tipo = comoTexto(dados.tipo).toLowerCase();

    if (titulo.length < 5) {
      throw new ErroValidacao(
        "Titulo do chamado deve ter no minimo 5 caracteres.",
      );
    }
    if (descricao.length < 20) {
      throw new ErroValidacao(
        "Descricao do chamado deve ter no minimo 20 caracteres.",
      );
    }
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      throw new ErroValidacao(
        `Categoria invalida. Use uma de: ${CATEGORIAS_VALIDAS.join(", ")}.`,
      );
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
      throw new ErroValidacao(
        `Tipo invalido. Use um de: ${TIPOS_VALIDOS.join(", ")}.`,
      );
    }

    return this.dao.criar({
      titulo,
      descricao,
      categoria,
      tipo,
      solicitanteId: ator.id,
    });
  }

  /**
   * Lista chamados visiveis para o ator (regra 3), com filtro opcional de
   * status. Agente ve todos; solicitante ve so os que ele mesmo abriu.
   *
   * @param ator    quem esta consultando
   * @param filtros filtros opcionais (por enquanto, `status`)
   */
  listar(ator: Ator, filtros: { status?: string } = {}): Chamado[] {
    let lista = this.dao.listar();

    // Regra 3: solicitante so enxerga os proprios chamados.
    if (ator.papel === "solicitante") {
      lista = lista.filter((chamado) => chamado.solicitanteId === ator.id);
    }

    // Filtro opcional de status (validado so se foi informado).
    if (filtros.status !== undefined) {
      const status = comoTexto(filtros.status).toLowerCase();
      if (!STATUS_VALIDOS.includes(status)) {
        throw new ErroValidacao(
          `Status invalido. Use um de: ${STATUS_VALIDOS.join(", ")}.`,
        );
      }
      lista = lista.filter((chamado) => chamado.status === status);
    }

    return lista;
  }

  /**
   * Detalha um chamado, respeitando a visibilidade (regra 3).
   *
   * @param idChamado id do chamado pedido
   * @param ator      quem esta consultando
   */
  detalhar(idChamado: string, ator: Ator): Chamado {
    const chamado = this.buscarOuFalhar(idChamado);
    if (ator.papel === "solicitante" && chamado.solicitanteId !== ator.id) {
      throw new ErroAcessoNegado("Voce nao tem acesso a este chamado.");
    }
    return chamado;
  }

  /**
   * Agente assume um chamado aberto (regras 1 e 2): ele vira "em_andamento"
   * e o ator passa a ser o agente atribuido.
   */
  assumir(idChamado: string, ator: Ator): Chamado {
    exigirAgente(ator);
    const chamado = this.buscarOuFalhar(idChamado);
    if (chamado.status !== "aberto") {
      throw new ErroValidacao(
        'So e possivel assumir um chamado com status "aberto".',
      );
    }
    chamado.status = "em_andamento";
    chamado.agenteId = ator.id;
    return this.dao.atualizar(chamado);
  }

  /**
   * Agente atribuido conclui o chamado (regras 1 e 2): vira "concluido" e
   * grava o momento da conclusao (base da janela de 7 dias da regra 7).
   */
  concluir(idChamado: string, ator: Ator): Chamado {
    exigirAgente(ator);
    const chamado = this.buscarOuFalhar(idChamado);
    if (chamado.agenteId !== ator.id) {
      throw new ErroAcessoNegado(
        "Apenas o agente atribuido pode concluir o chamado.",
      );
    }
    if (chamado.status !== "em_andamento") {
      throw new ErroValidacao('So e possivel concluir um chamado "em_andamento".');
    }
    chamado.status = "concluido";
    chamado.concluidoEm = new Date();
    return this.dao.atualizar(chamado);
  }

  /**
   * Solicitante reabre um chamado concluido em ate 7 dias (regra 7): ele
   * volta para "em_andamento", mantendo o mesmo agente atribuido.
   *
   * @param agora data de referencia para o prazo (default: agora). Receber
   *              por parametro facilita testar o limite dos 7 dias.
   */
  reabrir(idChamado: string, ator: Ator, agora: Date = new Date()): Chamado {
    const chamado = this.buscarOuFalhar(idChamado);

    if (ator.papel !== "solicitante" || chamado.solicitanteId !== ator.id) {
      throw new ErroAcessoNegado(
        "Apenas o solicitante que abriu o chamado pode reabri-lo.",
      );
    }
    if (chamado.status !== "concluido" || chamado.concluidoEm === null) {
      throw new ErroValidacao('So e possivel reabrir um chamado "concluido".');
    }

    const SETE_DIAS_EM_MS = 7 * 24 * 60 * 60 * 1000;
    if (agora.getTime() > chamado.concluidoEm.getTime() + SETE_DIAS_EM_MS) {
      throw new ErroValidacao(
        "Prazo de 7 dias para reabertura expirou. Abra um novo chamado.",
      );
    }

    chamado.status = "em_andamento";
    return this.dao.atualizar(chamado);
  }

  /**
   * Reatribui o chamado para outro agente (regras 2 e 3).
   *
   * @param novoAgenteId id do agente que recebera o chamado (vem do corpo
   *                     da requisicao, por isso chega como `unknown`).
   */
  reatribuir(idChamado: string, ator: Ator, novoAgenteId: unknown): Chamado {
    exigirAgente(ator);
    const chamado = this.buscarOuFalhar(idChamado);
    const novo = comoTexto(novoAgenteId);
    if (novo.length === 0) {
      throw new ErroValidacao("Informe o agente que recebera o chamado.");
    }
    chamado.agenteId = novo;
    return this.dao.atualizar(chamado);
  }

  /**
   * Altera a prioridade do chamado (regras 3 e 4).
   *
   * @param prioridade nova prioridade (vem do corpo, chega como `unknown`).
   */
  alterarPrioridade(
    idChamado: string,
    ator: Ator,
    prioridade: unknown,
  ): Chamado {
    exigirAgente(ator);
    const chamado = this.buscarOuFalhar(idChamado);
    const valor = comoTexto(prioridade).toLowerCase();
    const prioridadeValida = PRIORIDADES_VALIDAS.find((p) => p === valor);
    if (!prioridadeValida) {
      throw new ErroValidacao(
        `Prioridade invalida. Use uma de: ${PRIORIDADES_VALIDAS.join(", ")}.`,
      );
    }
    chamado.prioridade = prioridadeValida;
    return this.dao.atualizar(chamado);
  }

  /**
   * Busca um chamado pela DAO e lanca ErroNaoEncontrado se nao existir.
   * Usado por todas as acoes que operam sobre um chamado ja existente.
   */
  private buscarOuFalhar(idChamado: string): Chamado {
    const chamado = this.dao.buscarPorId(idChamado);
    if (!chamado) {
      throw new ErroNaoEncontrado("Chamado nao encontrado.");
    }
    return chamado;
  }
}
