import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { authRouter as tcAuthRouter } from "./src/server/authRouter";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple cookie parser middleware
  app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie;
    (req as any).cookies = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach((part) => {
        const [key, ...val] = part.trim().split('=');
        if (key) {
          try {
            (req as any).cookies[key] = decodeURIComponent(val.join('='));
          } catch {
            (req as any).cookies[key] = val.join('=');
          }
        }
      });
    }
    next();
  });

  // Global CORS and permissive headers with credentials support
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Health endpoint for cloud health checks
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Mount backend API routes directly at root (no /tc-auth prefix)
  app.use(tcAuthRouter);

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
