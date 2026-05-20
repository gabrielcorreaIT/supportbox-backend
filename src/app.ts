/**
 * Monta a aplicacao Express:
 *  - middlewares de plataforma (CORS, parser JSON)
 *  - endpoint de saude (`/saude`)
 *  - rotas da API sob o prefixo `/api`
 *  - tratador central de erros (deve ser o ultimo middleware)
 *
 * Recebe os Services por injecao de dependencias, mantendo o app
 * desacoplado da escolha de implementacao concreta.
 */
import express from "express";
import cors from "cors";
import { registrarRotas, type DependenciasDasRotas } from "./routes/index";
import { tratadorDeErros } from "./middlewares/tratadorDeErros";

export function criarApp(deps: DependenciasDasRotas) {
  const app = express();

  app.use(
    cors({
      origin: process.env.ORIGEM_FRONTEND || "http://localhost:3000",
    }),
  );
  app.use(express.json());

  app.get("/saude", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api", registrarRotas(deps));

  app.use(tratadorDeErros);

  return app;
}
