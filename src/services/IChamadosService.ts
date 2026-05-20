/**
 * Contrato do servico de chamados.
 *
 * Os metodos abaixo refletem as 7 regras descritas em
 * REGRAS_DE_NEGOCIO.md. A implementacao concreta chega na proxima
 * etapa do projeto. O Controller depende apenas desta interface (DIP).
 */
import type {
  CategoriaChamado,
  Chamado,
  PrioridadeChamado,
  StatusChamado,
  TipoChamado,
  Usuario,
} from "../types/dominio";

export interface DadosAberturaChamado {
  titulo: string;
  descricao: string;
  categoria: CategoriaChamado;
  tipo: TipoChamado;
}

export interface FiltrosListagem {
  status?: StatusChamado;
  busca?: string;
}

export interface IChamadosService {
  /** Regra 4 - cria chamado com prioridade padrao Media e protocolo automatico. */
  abrir(solicitante: Usuario, dados: DadosAberturaChamado): Promise<Chamado>;

  /** Regra 3 - solicitantes recebem so os proprios chamados; agentes recebem todos. */
  listar(usuario: Usuario, filtros: FiltrosListagem): Promise<Chamado[]>;

  /** Regra 3 - solicitante so pode consultar os chamados que abriu. */
  obterPorId(usuario: Usuario, idChamado: string): Promise<Chamado>;

  /** Regras 1 e 2 - apenas agentes; chamado em Aberto vai para Em Andamento. */
  assumir(agente: Usuario, idChamado: string): Promise<Chamado>;

  /** Regras 1 e 2 - apenas o agente atribuido pode concluir. */
  concluir(agente: Usuario, idChamado: string): Promise<Chamado>;

  /** Regra 7 - solicitante reabre em ate 7 dias apos a conclusao. */
  reabrir(solicitante: Usuario, idChamado: string): Promise<Chamado>;

  /** Regra 2 - agente reatribui o chamado a outro agente. */
  reatribuir(
    agenteAtual: Usuario,
    idChamado: string,
    novoAgenteId: string,
  ): Promise<Chamado>;

  /** Regra 4 - agente reclassifica a prioridade. */
  alterarPrioridade(
    agente: Usuario,
    idChamado: string,
    novaPrioridade: PrioridadeChamado,
  ): Promise<Chamado>;
}
