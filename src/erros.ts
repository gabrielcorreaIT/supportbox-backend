/**
 * Erros de dominio.
 *
 * Sao os tipos de erro que a camada de Service lanca quando uma acao nao
 * pode acontecer. Repare que eles NAO sabem nada de HTTP (nao tem codigo
 * de status nem formato de resposta): eles so descrevem O QUE deu errado.
 * Quem traduz cada um para um codigo HTTP e a camada HTTP - veja
 * `responderErro` em `utils/http.ts`.
 *
 * Por que classes separadas (e nao um `Error` generico)? Para o Controller
 * conseguir diferenciar, com `instanceof`, "dado invalido" (vira 400) de
 * "nao existe" (404) e de "sem permissao" (403).
 */

/**
 * Algo no pedido e invalido: dado mal formado, regra de negocio violada
 * ou transicao de estado nao permitida. Vira HTTP 400.
 */
export class ErroValidacao extends Error {}

/**
 * O recurso pedido nao existe (ex.: chamado com id inexistente).
 * Vira HTTP 404.
 */
export class ErroNaoEncontrado extends Error {}

/**
 * O usuario esta identificado, mas nao tem permissao para esta acao
 * (ex.: solicitante tentando concluir, ou agente nao atribuido tentando
 * comentar). Vira HTTP 403.
 */
export class ErroAcessoNegado extends Error {}
