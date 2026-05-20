/**
 * Ponto de entrada do servidor.
 *
 * Carrega variaveis de ambiente, monta o app e sobe o HTTP na porta
 * configurada. Nesta etapa apenas a camada de Controller existe; todos
 * os endpoints respondem 501.
 */
import "dotenv/config";
import { criarApp } from "./app";

const PORTA = Number(process.env.PORT ?? 4000);
const app = criarApp();

app.listen(PORTA, () => {
  console.log(
    `[supportbox-backend] escutando em http://localhost:${PORTA}`,
  );
  console.log(
    "[supportbox-backend] Somente Controllers nesta etapa - endpoints respondem 501.",
  );
});
