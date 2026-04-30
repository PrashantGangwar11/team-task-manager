import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const prisma = new PrismaClient();

// middlewares
app.use(cors({ origin: process.env.CLIENT_URL?.split(",") ?? "*", credentials: true }));
app.use(express.json());
app.set("prisma", prisma);

// API routes
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/projects", requireAuth, projectsRouter);
app.use("/api/tasks", requireAuth, tasksRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);

// path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve frontend (client/dist)
app.use(express.static(path.join(__dirname, "../../client/dist")));

// handle React routing (IMPORTANT)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

// error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

// server start
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Server running on port ${port}`));