/**
 * Tabela de rotas da API SupportBox.
 *
 * Cada entrada da tabela associa um metodo HTTP + um padrao de caminho a
 * um metodo de Controller. Padroes com parametros nomeados (`:id`,
 * `:idChamado`) sao compilados para `RegExp` com grupos de captura no
 * momento do registro, e os nomes ficam guardados em `nomesParametros`
 * para que o dispatcher consiga reconstruir um `Record<string, string>`
 * ao casar a rota.
 *
 * Nesta etapa, todos os endpoints respondem 501 (Service pendente).
 * Quando a Service layer entrar, cada metodo do Controller vai delegar
 * para um Service correspondente, que por sua vez chamara a DAO para
 * persistencia.
 *
 * Convencoes adotadas:
 *  - prefixo `/api` em todas as rotas REST (o endpoint `/saude` foi
 *    removido nesta fase por nao ser essencial);
 *  - verbos REST: POST para criar/acionar; GET para ler; PATCH para
 *    alterar parcialmente um recurso ja existente;
 *  - rotas aninhadas (ex.: `/chamados/:idChamado/comentarios`) refletem
 *    a relacao de pertencimento dos comentarios ao chamado pai.
 *
 * Posicao na arquitetura: este arquivo conecta a camada de roteamento
 * (`app.ts`) a camada de Controllers. Nao contem logica de negocio.
 */
import { AuthController } from "../controllers/AuthController";
import { ChamadosController } from "../controllers/ChamadosController";
import { ComentariosController } from "../controllers/ComentariosController";
import type { Manipulador } from "../utils/http";

/**
 * Estrutura de uma rota ja compilada, pronta para o dispatcher consumir.
 *
 *  - `metodo`: verbo HTTP em caixa alta (ex.: "GET", "POST", "PATCH").
 *  - `regex`: expressao regular gerada a partir do padrao textual,
 *    com cada `:nome` convertido em grupo de captura `([^/]+)` e com
 *    ancoras `^` e `$` para garantir match exato do path inteiro.
 *  - `nomesParametros`: nomes dos placeholders na ordem em que aparecem
 *    no padrao - serve para o dispatcher associar cada valor capturado
 *    pela regex ao nome correto.
 *  - `manipulador`: metodo do Controller que sera invocado quando a
 *    rota casar.
 */
export type Rota = {
  metodo: string;
  regex: RegExp;
  nomesParametros: string[];
  manipulador: Manipulador;
};

/**
 * Compila um padrao textual (ex.: `/api/chamados/:id`) em uma `RegExp`
 * estrita e devolve a lista de nomes de parametros encontrados.
 *
 * Cada `:nome` no padrao vira `([^/]+)`, que captura qualquer sequencia
 * de caracteres ate o proximo `/`. Isso significa que valores com `/`
 * dentro nao sao aceitos como parametro (`:id` nao casa com `abc/def`),
 * que e o comportamento esperado para identificadores simples como
 * UUIDs ou ids inteiros.
 *
 * As ancoras `^` e `$` em volta da regex garantem que o caminho casado
 * seja o caminho inteiro, evitando falsos positivos como `/api/chamados`
 * casando contra `/api/chamados/extra`.
 *
 * @param padrao texto da rota com placeholders no formato `:nome`
 * @returns objeto com `regex` compilada e `nomesParametros` na ordem
 */
function compilar(padrao: string): {
  regex: RegExp;
  nomesParametros: string[];
} {
  const nomes: string[] = [];
  const fonte = padrao.replace(/:(\w+)/g, (_, nome: string) => {
    nomes.push(nome);
    return "([^/]+)";
  });
  return { regex: new RegExp(`^${fonte}$`), nomesParametros: nomes };
}

/**
 * Helper para criar uma `Rota` de forma concisa.
 *
 * Encapsula a chamada de `compilar` e devolve o objeto `Rota` ja pronto
 * para entrar na tabela. Permite que a tabela em `listarRotas` fique
 * legivel como uma listagem declarativa de endpoints.
 *
 * @param metodo      verbo HTTP em caixa alta (ex.: "POST", "GET")
 * @param padrao      caminho com placeholders (ex.: `/api/chamados/:id`)
 * @param manipulador metodo do Controller a invocar quando a rota casar
 * @returns objeto `Rota` ja compilado
 */
function rota(
  metodo: string,
  padrao: string,
  manipulador: Manipulador,
): Rota {
  const { regex, nomesParametros } = compilar(padrao);
  return { metodo, regex, nomesParametros, manipulador };
}

/**
 * Devolve a tabela completa de rotas da aplicacao, ja compilada e pronta
 * para o dispatcher.
 *
 * Instancia uma vez cada Controller no inicio da funcao (singletons por
 * processo). Como os Controllers nao tem estado mutavel, compartilhar
 * uma instancia entre todas as requisicoes e seguro.
 *
 * A ordem das rotas e estavel (Auth -> Chamados -> Comentarios) para
 * ajudar a leitura, mas a ordem nao afeta o roteamento - o dispatcher
 * pega o primeiro match exato e nao tenta ranking entre patterns.
 *
 * @returns array de `Rota`s prontas para uso
 */
export function listarRotas(): Rota[] {
  const auth = new AuthController();
  const chamados = new ChamadosController();
  const comentarios = new ComentariosController();

  return [
    // -------------------------- Autenticacao --------------------------
    // Login com email + senha -> abre sessao
    rota("POST", "/api/auth/login", auth.login),
    // Encerra a sessao corrente
    rota("POST", "/api/auth/logout", auth.logout),
    // Retorna dados do usuario autenticado
    rota("GET", "/api/auth/me", auth.me),

    // --------------------------- Chamados -----------------------------
    // Cria um chamado novo
    rota("POST", "/api/chamados", chamados.abrir),
    // Lista chamados (filtros opcionais via query string)
    rota("GET", "/api/chamados", chamados.listar),
    // Detalha um chamado especifico
    rota("GET", "/api/chamados/:id", chamados.detalhar),
    // Agente assume o chamado para si
    rota("POST", "/api/chamados/:id/assumir", chamados.assumir),
    // Agente atribuido conclui o chamado
    rota("POST", "/api/chamados/:id/concluir", chamados.concluir),
    // Solicitante reabre um chamado concluido (regra: ate 7 dias)
    rota("POST", "/api/chamados/:id/reabrir", chamados.reabrir),
    // Reatribui o chamado para outro agente
    rota("PATCH", "/api/chamados/:id/atribuir", chamados.reatribuir),
    // Altera a prioridade do chamado (baixa/media/alta)
    rota("PATCH", "/api/chamados/:id/prioridade", chamados.alterarPrioridade),

    // -------------------------- Comentarios ---------------------------
    // Comentarios sao imutaveis (REGRAS_DE_NEGOCIO regra 5):
    // nao existem rotas de update nem delete.
    //
    // Adiciona um comentario novo a um chamado existente
    rota(
      "POST",
      "/api/chamados/:idChamado/comentarios",
      comentarios.adicionar,
    ),
    // Lista os comentarios de um chamado em ordem cronologica
    rota(
      "GET",
      "/api/chamados/:idChamado/comentarios",
      comentarios.listar,
    ),
  ];
}
