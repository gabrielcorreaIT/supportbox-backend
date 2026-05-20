/**
 * Ponto de entrada do servidor.
 *
 * Carrega variaveis de ambiente, monta o app com os Services
 * provisorios desta etapa (que respondem 501) e sobe o HTTP na porta
 * configurada. Na proxima etapa, as importacoes de
 * `lib/servicosPendentes` serao trocadas pelas classes reais.
 */
import "dotenv/config";
import { criarApp } from "./app";
import {
  authServicePendente,
  chamadosServicePendente,
  comentariosServicePendente,
} from "./lib/servicosPendentes";

const PORTA = Number(process.env.PORT ?? 4000);

const app = criarApp({
  authService: authServicePendente,
  chamadosService: chamadosServicePendente,
  comentariosService: comentariosServicePendente,
});

app.listen(PORTA, () => {
  console.log(
    `[supportbox-backend] escutando em http://localhost:${PORTA}`,
  );
  console.log(
    "[supportbox-backend] Services ainda nao implementados - endpoints respondem 501.",
  );
});
