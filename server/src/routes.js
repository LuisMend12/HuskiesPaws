// API routes. Every handler validates input, and JSON responses use the
// { success, data, error } envelope from http.js.
import { randomUUID } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MAX_SPEECH_CHARS, VOICES, petPrompt, postcardPrompt } from "./grok.js";
import { HttpError, clientIp, readJson, sendError, sendJson } from "./http.js";
import { createRateLimiter } from "./rateLimit.js";
import { grokVoiceFor } from "./tts.js";
import { currentHp, decideClaim } from "./turf.js";
import { validateClaim, validateImagine, validateLeaderboardQuery, validateRecall, validateScore, validateSpeech } from "./validate.js";
import { defenderAt, withBots } from "./bots.js";

const LEADERBOARD_LIMIT = 10;
const IMAGE_FETCH_TIMEOUT_MS = 30_000;

function imageExtension(buffer) {
  if (buffer.subarray(0, 4).toString("hex") === "89504e47") return "png";
  if (buffer.subarray(0, 2).toString("hex") === "ffd8") return "jpg";
  if (buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  throw new Error("Unrecognized image format");
}

const TTS_OFF = { enabled: false };

export function createRoutes({ store, grok, elevenlabs = TTS_OFF, tts, imagesDir, limits }) {
  const voice = tts ?? {
    enabled: elevenlabs.enabled || grok.enabled,
    summary: elevenlabs.enabled ? "elevenlabs" : grok.enabled ? "grok" : null,
    byAgent: {},
    async speak(text, agent, grokVoice) {
      if (elevenlabs.enabled) return elevenlabs.speak(text, agent);
      return grok.speak(text, grokVoice);
    },
  };
  const voiceLimit = createRateLimiter(limits.voice);
  const imageLimit = createRateLimiter(limits.image);
  const inFlight = new Map(); // image key -> promise, so one picture is never drawn twice at once

  function checkLimit(req, limiter) {
    const check = limiter(clientIp(req));
    if (!check.ok) throw new HttpError(429, check.reason);
  }

  function requireGrok(req, limiter) {
    if (!grok.enabled) throw new HttpError(503, "Grok isn't configured on this server (set XAI_API_KEY).");
    checkLimit(req, limiter);
  }

  async function fileExists(path) {
    try {
      return (await stat(join(imagesDir, path.replace("/images/", "")))).isFile();
    } catch {
      return false;
    }
  }

  async function saveGeneratedImage(result) {
    let buffer = result.image;
    if (!buffer) {
      const response = await fetch(result.url, { signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`Downloading the generated image failed (${response.status})`);
      buffer = Buffer.from(await response.arrayBuffer());
    }
    const name = `${randomUUID()}.${imageExtension(buffer)}`;
    await mkdir(imagesDir, { recursive: true });
    await writeFile(join(imagesDir, name), buffer);
    return `/images/${name}`;
  }

  async function generate(request) {
    const cached = await store.getImage(request.key);
    if (cached && (await fileExists(cached))) return cached;
    const prompt = request.kind === "postcard" ? postcardPrompt(request) : petPrompt(request);
    const path = await saveGeneratedImage(await grok.imagine(prompt));
    await store.saveImage(request.key, path);
    return path;
  }

  return {
    async recallGuard(req, res) {
      const { playerId, petId } = validateRecall(await readJson(req));
      const recalled = await store.recallGuard(playerId, petId);
      sendJson(res, 200, { recalled });
    },
    async health(req, res) {
      sendJson(res, 200, { grok: grok.enabled, tts: voice.summary, ttsByAgent: voice.byAgent, storage: store.kind });
    },

    async voice(req, res) {
      const { text, voice: grokVoice, agent } = validateSpeech(await readJson(req), VOICES, MAX_SPEECH_CHARS);
      if (!voice.enabled) {
        throw new HttpError(503, "Text-to-speech isn't configured on this server (set ELEVENLABS_API_KEY or XAI_API_KEY).");
      }
      checkLimit(req, voiceLimit);
      const { audio, contentType } = await voice.speak(text, agent, grokVoice || grokVoiceFor(agent));
      res.writeHead(200, { "Content-Type": contentType, "Content-Length": audio.length, "Cache-Control": "no-store" });
      res.end(audio);
    },

    async imagine(req, res) {
      const request = validateImagine(await readJson(req));
      const cached = await store.getImage(request.key);
      if (cached && (await fileExists(cached))) {
        sendJson(res, 200, { image: cached, cached: true });
        return;
      }
      requireGrok(req, imageLimit);
      if (!inFlight.has(request.key)) {
        inFlight.set(request.key, generate(request).finally(() => inFlight.delete(request.key)));
      }
      sendJson(res, 200, { image: await inFlight.get(request.key), cached: false });
    },

    async submitScore(req, res) {
      const player = validateScore(await readJson(req));
      await store.upsertPlayer(player);
      sendJson(res, 200, { saved: true });
    },

    async leaderboard(req, res, url) {
      const { scope, region } = validateLeaderboardQuery(url.searchParams);
      const me = url.searchParams.get("me");
      const players = await store.topPlayers(scope, region, LEADERBOARD_LIMIT);
      // Player ids stay private: they're what lets someone update a score.
      sendJson(res, 200, {
        scope,
        region,
        players: players.map((p, i) => ({ position: i + 1, name: p.name, score: p.score, isYou: p.id === me })),
      });
    },

    async listTurf(req, res, url) {
      const me = url.searchParams.get("me");
      const now = Date.now();
      const turf = withBots(await store.listTurf(), now)
        .map((t) => {
          const hp = currentHp(t, now);
          if (hp <= 0) return null;
          const pet = t.pet ?? {};
          return {
            landmarkId: t.landmarkId,
            title: t.title,
            lat: t.lat,
            lon: t.lon,
            ownerName: t.ownerName,
            claimedAt: t.claimedAt,
            hp,
            maxHp: t.maxHp ?? pet.power ?? hp,
            mine: t.ownerId === me,
            pet: {
              id: pet.id,
              name: pet.name,
              rarity: pet.rarity,
              petClass: pet.petClass,
              color: pet.color ?? "snowy",
              species: pet.species ?? null,
              spaceBorn: Boolean(pet.spaceBorn),
              power: pet.power,
              art: pet.art ?? null,
            },
          };
        })
        .filter(Boolean);
      sendJson(res, 200, { turf, serverNow: now });
    },

    async claimTurf(req, res) {
      const attempt = validateClaim(await readJson(req));
      const now = Date.now();
      const outcome = await store.claimTurf(attempt.landmarkId, (stored, allTurf) =>
        decideClaim({ defender: defenderAt(attempt.landmarkId, stored, now), allTurf, attempt, now }),
      );
      sendJson(res, 200, { result: outcome.result, message: outcome.message, won: Boolean(outcome.claim) });
    },
  };
}
