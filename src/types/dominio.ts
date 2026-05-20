/**
 * Tipos do dominio do SupportBox.
 *
 * Sao os modelos que circulam entre Controller e Service. Quando a
 * camada de Model chegar, estes tipos podem ser mantidos ou gerados a
 * partir das tabelas do Supabase. O frontend tem uma versao parecida em
 * `tipos-view.ts`, voltada para a tela.
 */

export type PapelUsuario = "solicitante" | "agente";

export type StatusChamado = "aberto" | "em_andamento" | "concluido";

export type PrioridadeChamado = "baixa" | "media" | "alta";

export type CategoriaChamado = "hardware" | "software" | "acesso" | "rede";

export type TipoChamado = "incidente" | "solicitacao";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
}

export interface Chamado {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaChamado;
  tipo: TipoChamado;
  prioridade: PrioridadeChamado;
  status: StatusChamado;
  solicitanteId: string;
  agenteAtribuidoId?: string;
  criadoEm: string;
  atualizadoEm: string;
  concluidoEm?: string;
}

export interface Comentario {
  id: string;
  chamadoId: string;
  autorId: string;
  texto: string;
  criadoEm: string;
  /** Comentario gerado automaticamente pelo sistema (mudanca de estado, atribuicao, etc.). */
  doSistema: boolean;
}
