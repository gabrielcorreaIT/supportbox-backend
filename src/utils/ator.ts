/**
 * Extrator do "ator" (quem esta fazendo a requisicao).
 *
 * ATENCAO - SOLUCAO TEMPORARIA: ainda nao existe autenticacao de verdade
 * neste projeto. Enquanto ela nao chega, o Controller descobre quem esta
 * agindo lendo dois cabecalhos HTTP que o frontend envia:
 *
 *   X-Usuario-Id:    id do usuario
 *   X-Usuario-Papel: "solicitante" ou "agente"
 *
 * Isso e SO um andaime para conseguir testar as regras de permissao e
 * visibilidade de ponta a ponta. Quando a autenticacao real entrar (login
 * + token), este arquivo passa a extrair o ator do token ja validado, e os
 * Controllers nem precisam mudar.
 *
 * Posicao na arquitetura: utilitario de infraestrutura HTTP - le headers e
 * devolve um `Ator` do dominio. Nao tem regra de negocio.
 */
import type { IncomingMessage } from "http";
import type { Ator } from "../dominio";

/**
 * Le os cabecalhos de identificacao e devolve o `Ator`, ou `null` se eles
 * estiverem ausentes ou invalidos (nesse caso o Controller responde 401).
 *
 * @param req requisicao HTTP de onde os cabecalhos serao lidos
 * @returns o `Ator` identificado, ou `null` se nao der para identificar
 */
export function extrairAtor(req: IncomingMessage): Ator | null {
  const id = req.headers["x-usuario-id"];
  const papel = req.headers["x-usuario-papel"];

  // `id` precisa ser uma string nao vazia.
  if (typeof id !== "string" || id.trim() === "") return null;

  // `papel` precisa ser exatamente um dos papeis validos do dominio.
  if (papel !== "solicitante" && papel !== "agente") return null;

  return { id: id.trim(), papel };
}
