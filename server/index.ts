import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Initialize express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// FORCE SSL VERIFICATION OFF GLOBALLY FOR INTERNAL CALLS
// This fixes the "ERR_TLS_CERT_ALTNAME_INVALID" when the backend
// fetches from localhost (which often has self-signed certs)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Simple logger implementation
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Request logging middleware
app.use((req, res, next) => {
  // Skip logging for internal/health checks if needed, or filter WS pollution
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    // Only log API requests to reduce noise, unless it's an error
    if (path.startsWith("/api") || res.statusCode >= 400) {
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Dynamic import to avoid loading Vite in production
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // Production static file serving
    // Calculate __dirname equivalent for ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const distPath = path.resolve(__dirname, "public");

    if (!fs.existsSync(distPath)) {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`,
      );
    }

    app.use(express.static(distPath));

    // Fall through to index.html if the file doesn't exist
    app.use("*", (req, res) => {
      // Fix for "WS Error": Stop serving index.html for WebSocket upgrade requests
      // This prevents 200 OK responses to WS clients, which confuses them and spams logs.
      if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
          res.status(426).send('Upgrade Required'); // Or 400 Bad Request
          return;
      }
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  // Read port from environment variable
  // Default: 3000 for macOS development (ControlCenter uses 5000), 5000 for production
  const defaultPort = process.platform === "darwin" ? 3000 : 5000;
  const port = process.env.PORT ? parseInt(process.env.PORT) : defaultPort;
  
  // CRITICAL: Host binding depends on environment
  // - Production (NODE_ENV=production): Use 127.0.0.1 because Nginx reverse proxy expects localhost
  // - Development: Use 0.0.0.0 to allow iOS Simulator access via local network IP
  const host = process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0";
  
  server.listen({
    port,
    host,
    reusePort: true,
  }, () => {
    log(`serving on port ${port} (host: ${host})`);
  });
})();
