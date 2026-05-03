import "dotenv/config";
import express from "express";
import cors from "cors";
import { listUsers } from "./db";
import { seed } from "./seed";

seed();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/users", (_req, res) => {
  res.json(listUsers());
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`server listening on http://0.0.0.0:${port}`);
});
