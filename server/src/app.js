// Builds the HTTP server: /api routes and generated images, for the phone app.
import { createServer } from "node:http";
import { join } from "node:path";
import { HttpError, sendError, serveStatic } from "./http.js";
import { createRoutes } from "./routes.js";
import { createBankRoutes } from "./bank.js";
import { attachDayLogs, createDayRoutes } from "./day.js";

// elevenlabs and tts (per-agent voice choice) come from index.js; without them
// every agent falls back to Grok Voice.
export function createApp({ config, store, grok, elevenlabs, tts, bankClient }) {
  const gameStore = attachDayLogs(store);
  const routes = createRoutes({ store: gameStore, grok, elevenlabs, tts, imagesDir: join(config.dataDir, "images"), limits: config.limits });
  const bank = createBankRoutes({ store: gameStore, key: config.nessieKey, client: bankClient });
  const day = createDayRoutes({ store: gameStore });

  const table = {
    "GET /api/health": routes.health,
    "POST /api/voice": routes.voice,
    "POST /api/imagine": routes.imagine,
    "POST /api/score": routes.submitScore,
    "GET /api/leaderboard": routes.leaderboard,
    "GET /api/turf": routes.listTurf,
    "POST /api/turf/claim": routes.claimTurf,
    "POST /api/turf/recall": routes.recallGuard,
    "POST /api/bank/connect": bank.connect,
    "POST /api/bank/transfer": bank.transfer,
    "POST /api/day": day.putDay,
    "GET /api/day": day.getDay,
  };

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
      if (url.pathname.startsWith("/images/")) {
        if (await serveStatic(res, join(config.dataDir, "images"), url.pathname.slice("/images".length))) return;
        throw new HttpError(404, "Image not found");
      }
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
