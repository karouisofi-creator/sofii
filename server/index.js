import "dotenv/config";

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev-secret-change-in-production";
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import adminUsersRoutes from "./routes/admin/users.js";
import adminLogsRoutes from "./routes/admin/logs.js";
import ticketsRoutes from "./routes/tickets.js";
// Use the integrated chat router (includes Groq integration and public test endpoints)
import chatRoutes from "./routes/chat-integrated.js";
import queryRoutes from "./routes/query.js";
import adminReportsRoutes from "./routes/admin/reports.js";
import dataRoutes from "./routes/data.js";
import { initStore } from "./store/index.js";
import { validateJwtSecret } from "./utils/security.js";

const app = express();
const PORT = process.env.PORT || 3000;
const IS_DEV = process.env.NODE_ENV !== "production";

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    ""
  );
}

function isLocalhostIp(ip) {
  return ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip);
}

// Helmet : en-têtes HTTP de sécurité
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// Limite globale API (100 req / 15 min par IP)
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_DEV ? 999999 : 100,
    message: { error: "Trop de requêtes, réessayez plus tard" },
    keyGenerator: (req) => getClientIp(req),
    // Disable rate limit completely in dev
    skip: (req) => IS_DEV === true,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(express.json({ limit: "10kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/logs", adminLogsRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/admin/reports", adminReportsRoutes);
app.use("/api/reports", adminReportsRoutes);
app.use("/api/data", dataRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "DataFlow Assurance API",
    docs: "http://localhost:3000/api/health",
    message: "Backend en marche. Utilisez /api/health pour vérifier.",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "DataFlow Assurance API" });
});

async function start() {
  if (!validateJwtSecret()) {
    console.warn(
      "⚠ JWT_SECRET faible ou manquant. En production, utilisez une chaîne aléatoire d'au moins 32 caractères.",
    );
  }

  const mode = await initStore();
  if (mode === "sql") {
    console.log("✓ SQL Server connecté");
  } else {
    console.log("✓ Mode développement : stockage en mémoire (sans SQL Server)");
    console.log("  → Compte admin : admin@dataflow.com / Admin123!");
  }

  const server = app.listen(PORT, () => {
    console.log(`✓ API DataFlow Assurance sur http://localhost:${PORT}`);
  });

  server.on("error", (err) => {
    if (err?.code === "EADDRINUSE") {
      console.warn(
        `⚠ Le port ${PORT} est déjà utilisé. Un autre backend est probablement déjà en cours d'exécution.`,
      );
      return;
    }

    console.error(err);
    process.exitCode = 1;
  });
}

start().catch(console.error);
