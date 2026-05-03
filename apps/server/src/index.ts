import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { listMessages, listUsers } from "./db";
import { seed } from "./seed";
import { attachRealtime } from "./realtime";

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

app.get("/conversations/:id/messages", (req, res) => {
  const conversationId = req.params.id;
  res.json(listMessages(conversationId));
});

const httpServer = http.createServer(app);
attachRealtime(httpServer);

const port = Number(process.env.PORT ?? 3001);
httpServer.listen(port, () => {
  console.log(`server listening on http://0.0.0.0:${port}`);
});
