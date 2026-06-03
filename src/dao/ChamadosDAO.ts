/**
 * DAO de chamados (camada de persistencia).
 *
 * Posicao na arquitetura: a DAO e a metade do "Model" responsavel
 * EXCLUSIVAMENTE por guardar e recuperar dados. Ela nao conhece regra de
 * negocio (isso e do Service) nem HTTP (isso e do Controller). Ela so
 * responde a pergunta "como eu gravo/leio isto?".
 *
 *               dominio
 *               /     \
 *          Service --> DAO    (o Service chama a DAO para persistir)
 *
 * --- Onde os dados ficam guardados ---
 *
 * Nesta primeira versao, a "tabela" de chamados e um `Map` em memoria
 * (logo abaixo). Pense nele como uma tabela de banco que mora dentro do
 * processo Node:
 *   - a chave do Map e o `id` do chamado;
 *   - o valor e o registro completo do chamado.
 *
 * VANTAGEM: zero configuracao - nada de credenciais, rede, SQL ou servico
 * externo. Perfeito para desenvolver e aprender a arquitetura rapido.
 *
 * LIMITACAO IMPORTANTE: os dados vivem so na memoria RAM. Quando o
 * servidor reinicia, TUDO some. Em desenvolvimento isso acontece bastante,
 * porque o `npm run dev` (tsx watch) reinicia a cada vez que voce salva um
 * arquivo. Para dados que precisam sobreviver a reinicios (producao de
 * verdade), troca-se este arquivo por uma implementacao com banco real
 * (ex.: Supabase). E, como o resto do sistema so conversa com a DAO pelos
 * metodos abaixo, essa troca NAO mexe no Service nem no Controller.
 *
 * Operacoes desta DAO: criar (`criar`), ler (`buscarPorId`, `listar`) e
 * atualizar (`atualizar`). Nao ha apagar de proposito: o sistema nao
 * remove chamados - eles seguem o ciclo de vida e ficam no historico.
 */
import { randomUUID } from "crypto";
import type { Chamado } from "../dominio";

/**
 * Dados que o chamador entrega para CRIAR um chamado. Sao apenas os campos
 * "de conteudo", ja validados pelo Service. Os demais campos do chamado
 * (id, protocolo, status inicial, datas...) sao preenchidos pela propria
 * DAO no momento da criacao - veja `criar`.
 */
export type DadosCriarChamado = {
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: string;
  solicitanteId: string;
};

/**
 * A "tabela" de chamados em memoria, indexada por `id`.
 *
 * Fica no escopo do modulo (e nao dentro da classe) de proposito: assim
 * existe UMA unica tabela compartilhada por todo o processo, do mesmo
 * jeito que a aplicacao inteira conversa com um unico banco. Criar
 * `new ChamadosDAO()` em lugares diferentes nao gera copias dos dados.
 */
const tabelaChamados = new Map<string, Chamado>();

/**
 * Gera o protocolo legivel do chamado no formato `CH-AAAA-NNN`
 * (REGRAS_DE_NEGOCIO, regra 4): sequencial por ano.
 *
 * Conta quantos chamados deste ano ja existem na tabela e soma 1, com a
 * sequencia preenchida ate 3 digitos (001, 002, ...).
 *
 * Observacao: como a tabela vive em memoria, a contagem (e portanto a
 * sequencia) reinicia junto com o servidor. Numa DAO com banco real, esse
 * contador viveria no banco e seria de fato continuo ano a ano.
 *
 * @param ano ano de referencia (normalmente o ano corrente)
 * @returns protocolo no formato `CH-AAAA-NNN`
 */
function gerarProtocolo(ano: number): string {
  let qtdNoAno = 0;
  for (const chamado of tabelaChamados.values()) {
    if (chamado.criadoEm.getFullYear() === ano) {
      qtdNoAno++;
    }
  }
  const sequencial = String(qtdNoAno + 1).padStart(3, "0");
  return `CH-${ano}-${sequencial}`;
}

export class ChamadosDAO {
  /**
   * Grava um chamado novo na tabela e devolve o registro completo.
   *
   * A DAO preenche aqui os campos "tecnicos" e o estado inicial - o
   * equivalente aos valores DEFAULT de uma tabela de banco:
   *   - `id`:          identificador unico (UUID);
   *   - `protocolo`:   gerado no formato CH-AAAA-NNN (regra 4);
   *   - `status`:      "aberto" (regra 1: todo chamado nasce Aberto);
   *   - `prioridade`:  "media" (regra 4: prioridade inicial padrao);
   *   - `agenteId`:    null (ainda sem agente atribuido);
   *   - `criadoEm`:    agora;
   *   - `concluidoEm`: null (ainda nao concluido).
   *
   * @param dados campos de conteudo do chamado (ja validados pelo Service)
   * @returns o chamado recem-criado, completo
   */
  criar(dados: DadosCriarChamado): Chamado {
    const agora = new Date();
    const chamado: Chamado = {
      id: randomUUID(),
      protocolo: gerarProtocolo(agora.getFullYear()),
      titulo: dados.titulo,
      descricao: dados.descricao,
      categoria: dados.categoria,
      tipo: dados.tipo,
      status: "aberto",
      prioridade: "media",
      solicitanteId: dados.solicitanteId,
      agenteId: null,
      criadoEm: agora,
      concluidoEm: null,
    };

    tabelaChamados.set(chamado.id, chamado);

    // Devolve uma COPIA: assim o chamador nao consegue alterar o registro
    // guardado "por fora". Um banco real tambem devolve uma copia dos
    // dados, nunca um atalho direto para a linha armazenada.
    return { ...chamado };
  }

  /**
   * Busca um chamado pelo seu `id`.
   *
   * @param id identificador do chamado
   * @returns o chamado (uma copia), ou `null` se nao existir
   */
  buscarPorId(id: string): Chamado | null {
    const chamado = tabelaChamados.get(id);
    return chamado ? { ...chamado } : null;
  }

  /**
   * Lista todos os chamados guardados, sem filtrar.
   *
   * Quem decide o que cada usuario pode ver (regra 3 de visibilidade) e o
   * Service - a DAO so entrega os dados crus.
   *
   * @returns um array com copias de todos os chamados
   */
  listar(): Chamado[] {
    return [...tabelaChamados.values()].map((chamado) => ({ ...chamado }));
  }

  /**
   * Substitui um chamado ja existente pela versao atualizada recebida.
   *
   * A DAO NAO decide o que muda nem se a mudanca e valida - isso e papel
   * do Service. Aqui a gente so regrava o registro inteiro no lugar do
   * antigo (como um UPDATE que troca a linha pela nova versao).
   *
   * O fluxo tipico no Service e: buscar o chamado (`buscarPorId`), aplicar
   * as mudancas no objeto e mandar de volta para ca via `atualizar`.
   *
   * @param chamado o chamado completo, ja com os campos alterados
   * @returns o chamado atualizado (uma copia)
   * @throws Error se nao existir nenhum chamado com aquele `id` (nao se
   *               atualiza algo que nunca foi criado).
   */
  atualizar(chamado: Chamado): Chamado {
    if (!tabelaChamados.has(chamado.id)) {
      throw new Error(
        `Nao e possivel atualizar: chamado ${chamado.id} nao existe.`,
      );
    }

    const atualizado = { ...chamado };
    tabelaChamados.set(atualizado.id, atualizado);
    return { ...atualizado };
  }
}
