/**
 * Monta a aplicacao Express:
 *  - CORS (permite o frontend chamar a API)
 *  - parser JSON do body
 *  - endpoint de saude (`/saude`)
 *  - rotas da API sob o prefixo `/api`
 */
import express from "express";
import cors from "cors";
import { registrarRotas } from "./routes/index";

export function criarApp() {
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

  app.use("/api", registrarRotas());

  return app;
}
