/**
 * Vocabulario de dominio compartilhado.
 *
 * Aqui ficam os "tipos basicos" que descrevem o dominio do SupportBox e
 * que aparecem nas REGRAS_DE_NEGOCIO.md: o papel do usuario, os estados de
 * um chamado, os niveis de prioridade e a forma de um chamado.
 *
 * Este modulo fica ABAIXO das camadas Service e DAO - as duas dependem
 * dele, e ele nao depende de ninguem. Por isso ele vive na raiz de `src`
 * (e nao dentro de `services/` ou `dao/`):
 *
 *               dominio        (so tipos: sem regra, sem banco)
 *               /     \
 *          Service     DAO
 *
 * Importante: este arquivo descreve apenas a FORMA do dominio (os tipos).
 * Ele NAO tem regra de negocio (isso vive no Service) nem acesso a banco
 * (isso vive na DAO).
 */

/**
 * Papel do usuario que executa a acao (REGRAS_DE_NEGOCIO, regra 3).
 *  - "solicitante": abre chamados e acompanha os seus.
 *  - "agente":      atende chamados (assume, conclui, reatribui, etc.).
 */
export type Papel = "solicitante" | "agente";

/**
 * Estado de um chamado no seu ciclo de vida (REGRAS_DE_NEGOCIO, regra 1).
 * A ordem permitida e: aberto -> em_andamento -> concluido. Nao se pula
 * etapa - cada transicao e validada no ChamadosService.
 */
export type StatusChamado = "aberto" | "em_andamento" | "concluido";

/**
 * Nivel de prioridade de um chamado (REGRAS_DE_NEGOCIO, regras 4 e 6).
 * O padrao na abertura e "media".
 */
export type Prioridade = "baixa" | "media" | "alta";

/**
 * Quem esta executando a acao. Vem do usuario autenticado (a autenticacao
 * real entra em uma etapa futura); por ora, o Controller informa esses
 * dados ao Service.
 *
 *  - `id`:    identifica o usuario - usado para checar "o proprio
 *             chamado", "o agente atribuido", "o solicitante original".
 *  - `papel`: define o que ele pode fazer (regra 3).
 */
export type Ator = {
  id: string;
  papel: Papel;
};

/**
 * Um chamado completo - a forma como ele e guardado e devolvido pela DAO.
 *
 *  - `id`:            chave interna unica (gerada pela DAO).
 *  - `protocolo`:     identificador legivel para humanos no formato
 *                     CH-AAAA-NNN (regra 4); imutavel.
 *  - `titulo`:        titulo informado na abertura.
 *  - `descricao`:     descricao informada na abertura.
 *  - `categoria`:     hardware | software | acesso | rede (regra 4).
 *  - `tipo`:          incidente | solicitacao (regra 4).
 *  - `status`:        estado atual no ciclo de vida (regra 1).
 *  - `prioridade`:    nivel de prioridade atual (regra 4).
 *  - `solicitanteId`: quem abriu o chamado (regras 3 e 7).
 *  - `agenteId`:      agente atribuido, ou `null` enquanto "aberto"
 *                     (regra 2: no maximo um agente por vez).
 *  - `criadoEm`:      momento da criacao.
 *  - `concluidoEm`:   momento da conclusao, ou `null` se ainda nao foi
 *                     concluido (base para a janela de 7 dias da regra 7).
 */
export type Chamado = {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: string;
  status: StatusChamado;
  prioridade: Prioridade;
  solicitanteId: string;
  agenteId: string | null;
  criadoEm: Date;
  concluidoEm: Date | null;
};

/**
 * Um comentario de um chamado - a forma como ele e guardado e devolvido
 * pela DAO. Comentarios sao IMUTAVEIS (REGRAS_DE_NEGOCIO, regra 5): uma vez
 * criados, nunca mudam - por isso nao existe um campo "editadoEm".
 *
 *  - `id`:        chave interna unica (gerada pela DAO).
 *  - `chamadoId`: a qual chamado este comentario pertence.
 *  - `autor`:     id do usuario que escreveu; ou a constante "Sistema"
 *                 para os comentarios automaticos de mudanca de status,
 *                 atribuicao ou prioridade (regra 5).
 *  - `texto`:     conteudo do comentario.
 *  - `criadoEm`:  momento em que foi criado (usado para mostrar a conversa
 *                 em ordem cronologica).
 */
export type Comentario = {
  id: string;
  chamadoId: string;
  autor: string;
  texto: string;
  criadoEm: Date;
};
