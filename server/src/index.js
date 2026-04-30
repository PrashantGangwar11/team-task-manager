import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: process.env.CLIENT_URL?.split(",") ?? "*", credentials: true }));
app.use(express.json());
app.set("prisma", prisma);

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/projects", requireAuth, projectsRouter);
app.use("/api/tasks", requireAuth, tasksRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Server running on port ${port}`));
