// Builds the HTTP server: /api routes, generated images, /env.js, and the web app.
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { HttpError, sendError, serveStatic } from "./http.js";
import { createRoutes } from "./routes.js";

export function createApp({ config, store, grok }) {
  const routes = createRoutes({ store, grok, imagesDir: join(config.dataDir, "images"), limits: config.limits });

  const table = {
    "GET /api/health": routes.health,
    "POST /api/voice": routes.voice,
    "POST /api/imagine": routes.imagine,
    "POST /api/score": routes.submitScore,
    "GET /api/leaderboard": routes.leaderboard,
    "GET /api/turf": routes.listTurf,
    "POST /api/turf/claim": routes.claimTurf,
  };

  // Like serve.py: only browser-safe values reach the page.
  function envScript() {
    const env = { API: true, GROK: grok.enabled };
    if (config.mapboxToken) env.MAPBOX_TOKEN = config.mapboxToken;
    return `window.WANDERLINGS_ENV = ${JSON.stringify(env)};\n`;
  }

  return createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      const handler = table[`${req.method} ${url.pathname}`];
      if (handler) {
        await handler(req, res, url);
        return;
      }
      if (url.pathname.startsWith("/api/")) throw new HttpError(404, "Unknown API route");
      if (req.method !== "GET" && req.method !== "HEAD") throw new HttpError(405, "Method not allowed");
      if (url.pathname === "/env.js") {
        const body = envScript();
        res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
        res.end(body);
        return;
      }
      if (url.pathname.startsWith("/images/")) {
        if (await serveStatic(res, join(config.dataDir, "images"), url.pathname.slice("/images".length))) return;
        throw new HttpError(404, "Image not found");
      }
      if (await serveStatic(res, resolve(config.webRoot), url.pathname)) return;
      throw new HttpError(404, "Not found");
    } catch (error) {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      if (error instanceof HttpError) {
        sendError(res, error.status, error.message);
        return;
      }
      console.error(`${req.method} ${url.pathname} failed:`, error);
      sendError(res, 502, "Something went wrong talking to an outside service. Try again.");
    }
  });
}
