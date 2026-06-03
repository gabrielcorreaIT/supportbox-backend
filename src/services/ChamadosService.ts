export type DadosAbrirChamado = {
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: string;
};

/**
 * Categorias permitidas para um chamado (REGRAS_DE_NEGOCIO).
 * Qualquer valor fora desta lista e rejeitado pelo Service.
 */
const CATEGORIAS_VALIDAS = ["hardware", "software", "acesso", "rede"];

/**
 * Tipos permitidos para um chamado (REGRAS_DE_NEGOCIO).
 *   - "incidente":   algo quebrou e precisa ser consertado.
 *   - "solicitacao": pedido novo (instalacao, acesso, etc.).
 */
const TIPOS_VALIDOS = ["incidente", "solicitacao"];

export class ChamadosService {
  /**
   * Abre um chamado novo, depois de validar todas as regras de negocio.
   *
   * Regras aplicadas aqui (na ordem):
   *   1. titulo nao pode estar vazio (nem ser so espacos em branco);
   *   2. descricao nao pode estar vazia (nem ser so espacos em branco);
   *   3. categoria precisa ser uma de: hardware, software, acesso, rede;
   *   4. tipo precisa ser um de: incidente, solicitacao.
   *
   * Se qualquer regra for violada, lanca um `Error` com uma mensagem
   * que explica o que deu errado. O Controller, no futuro, vai
   * capturar esse erro e transformar em uma resposta HTTP 400.
   *
   * Quando a DAO existir, este metodo passara a:
   *   a. validar (ja faz hoje);
   *   b. chamar `ChamadosDAO.salvar(...)` para gravar no banco;
   *   c. devolver o chamado ja salvo (com id, data de criacao, etc.).
   *
   * Por enquanto, depois de validar, ele apenas lanca "DAO pendente",
   * indicando que a camada de persistencia ainda nao existe.
   *
   * @param dados informacoes do chamado a ser aberto
   * @throws Error caso alguma regra de negocio seja violada,
   *               ou "DAO pendente" caso as regras passem (pois
   *               ainda nao e possivel persistir).
   */
  abrir(dados: DadosAbrirChamado): void {
    // Regra 1: titulo obrigatorio
    if (!dados.titulo || dados.titulo.trim().length === 0) {
      throw new Error("Titulo do chamado e obrigatorio.");
    }

    // Regra 2: descricao obrigatoria
    if (!dados.descricao || dados.descricao.trim().length === 0) {
      throw new Error("Descricao do chamado e obrigatoria.");
    }

    // Regra 3: categoria precisa estar entre as opcoes validas
    if (!CATEGORIAS_VALIDAS.includes(dados.categoria)) {
      throw new Error(
        `Categoria invalida. Use uma de: ${CATEGORIAS_VALIDAS.join(", ")}.`,
      );
    }

    // Regra 4: tipo precisa estar entre as opcoes validas
    if (!TIPOS_VALIDOS.includes(dados.tipo)) {
      throw new Error(`Tipo invalido. Use um de: ${TIPOS_VALIDOS.join(", ")}.`);
    }

    // Passou em todas as regras de negocio.
    // Aqui entraria a chamada para a DAO, mas ela ainda nao existe.
    throw new Error("DAO pendente: ChamadosDAO.salvar() ainda nao existe.");
  }
}
