/**
 * Contrato do servico de autenticacao.
 *
 * Esta etapa do projeto traz apenas a interface. A implementacao
 * concreta, provavelmente usando Supabase Auth, chega na proxima
 * etapa.
 *
 * Os Controllers dependem desta abstracao (principio DIP do SOLID):
 * trocar a tecnologia de autenticacao mais tarde nao impacta o
 * Controller, basta criar outra classe que implemente esta interface.
 */
import type { Usuario } from "../types/dominio";

export interface ResultadoLogin {
  usuario: Usuario;
  /** Token de sessao a ser usado no header Authorization das proximas chamadas. */
  token: string;
}

export interface IAuthService {
  /**
   * Valida credenciais e devolve usuario + token de sessao.
   * Lanca ErroDeAutenticacao se as credenciais nao baterem.
   */
  login(email: string, senha: string): Promise<ResultadoLogin>;

  /** Encerra a sessao associada ao token. */
  logout(token: string): Promise<void>;

  /**
   * Resolve o usuario dono de um token de sessao.
   * Lanca ErroDeAutenticacao se o token for invalido ou expirado.
   */
  obterUsuarioDoToken(token: string): Promise<Usuario>;
}
