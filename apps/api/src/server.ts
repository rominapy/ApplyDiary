import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import applicationsRouter from "./routes/applications.js";
import { env } from "./utils/env.js";
import { prisma } from "./utils/prisma.js";

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "applydiary-api" });
});

app.use("/auth", authRouter);
app.use("/applications", applicationsRouter);

app.use((_, res) => {
  res.status(404).json({ message: "Not found" });
});

const server = app.listen(env.port, () => {
  console.log(`ApplyDiary API running on http://localhost:${env.port}`);
});

async function shutdown(): Promise<void> {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
