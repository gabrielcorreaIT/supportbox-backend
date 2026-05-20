/**
 * Erros de dominio que Controllers e Services lancam para indicar
 * falhas previsiveis. O middleware `tratadorDeErros` traduz cada classe
 * para um status HTTP apropriado.
 *
 * Vantagem de ter classes proprias: a regra de negocio nao fica
 * acoplada ao Express. O Service pode ser chamado por outros
 * transportes (CLI, filas) sem mudanca alguma.
 */

export class ErroDoDominio extends Error {
  constructor(
    public readonly mensagem: string,
    public readonly status: number,
  ) {
    super(mensagem);
    this.name = new.target.name;
  }
}

export class ErroDeValidacao extends ErroDoDominio {
  constructor(mensagem: string) {
    super(mensagem, 400);
  }
}

export class ErroDeAutenticacao extends ErroDoDominio {
  constructor(mensagem = "Usuario nao autenticado.") {
    super(mensagem, 401);
  }
}

export class ErroDePermissao extends ErroDoDominio {
  constructor(mensagem = "Operacao nao permitida para este usuario.") {
    super(mensagem, 403);
  }
}

export class ErroNaoEncontrado extends ErroDoDominio {
  constructor(mensagem: string) {
    super(mensagem, 404);
  }
}

export class ErroDeConflito extends ErroDoDominio {
  constructor(mensagem: string) {
    super(mensagem, 409);
  }
}

export class ErroNaoImplementado extends ErroDoDominio {
  constructor(mensagem = "Funcionalidade ainda nao implementada.") {
    super(mensagem, 501);
  }
}
