// Input validation at the API boundary. Each validator returns a clean object
// or throws HttpError(400) with a message that's safe to show the user.
import { PET_COLORS } from "../../core/pets.js";
import { HttpError } from "./http.js";

const RARITIES = ["common", "rare", "epic", "legendary"];
const PET_CLASSES = ["Scout", "Storyteller", "Pathfinder", "Guardian"];
const PET_COLOR_NAMES = PET_COLORS.map((c) => c.name);
const SCOPES = ["local", "state", "national"];
const ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

const fail = (message) => {
  throw new HttpError(400, message);
};

function str(value, field, { max = 80, min = 1 } = {}) {
  if (typeof value !== "string") fail(`${field} must be text`);
  const trimmed = value.trim().replace(/[\u0000-\u001f]/g, "");
  if (trimmed.length < min || trimmed.length > max) fail(`${field} must be ${min}-${max} characters`);
  return trimmed;
}

function num(value, field, { min, max }) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    fail(`${field} must be a number from ${min} to ${max}`);
  }
  return value;
}

function oneOf(value, field, options) {
  if (!options.includes(value)) fail(`${field} must be one of: ${options.join(", ")}`);
  return value;
}

function playerId(value) {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) fail("playerId is invalid");
  return value;
}

function region(value) {
  if (!value || typeof value !== "object") fail("region is required");
  return {
    local: str(value.local, "region.local"),
    state: str(value.state, "region.state"),
    national: str(value.national, "region.national"),
  };
}

export function validateScore(body) {
  return {
    id: playerId(body.playerId),
    name: str(body.name, "name", { max: 24 }),
    score: Math.floor(num(body.score, "score", { min: 0, max: 1_000_000 })),
    region: region(body.region),
  };
}

export function validateLeaderboardQuery(params) {
  return {
    scope: oneOf(params.get("scope"), "scope", SCOPES),
    region: str(params.get("region") ?? "", "region"),
  };
}

export function validateSpeech(body, voices, maxChars) {
  return {
    text: str(body.text, "text", { max: maxChars }),
    voice: oneOf(body.voice ?? voices[0], "voice", voices),
  };
}

export function validateImagine(body) {
  const kind = oneOf(body.kind, "kind", ["postcard", "pet"]);
  if (kind === "postcard") {
    return {
      kind,
      key: `postcard:${str(String(body.placeId ?? ""), "placeId", { max: 40 })}`,
      title: str(body.title, "title", { max: 120 }),
      fact: str(body.fact ?? "", "fact", { min: 0, max: 300 }),
    };
  }
  return {
    kind,
    key: `pet:${playerId(body.petId)}`,
    rarity: oneOf(body.rarity, "rarity", RARITIES),
    petClass: oneOf(body.petClass, "petClass", PET_CLASSES),
    color: oneOf(body.color, "color", PET_COLOR_NAMES),
  };
}

function petArt(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") fail("pet.art must be text");
  const art = value.trim();
  if (art.startsWith("/images/")) return art.slice(0, 80);
  if (/^https:\/\//i.test(art)) return art.slice(0, 240);
  fail("pet.art must be an /images/ path or https URL");
}

export function validateClaim(body) {
  const pet = body.pet ?? fail("pet is required");
  return {
    playerId: playerId(body.playerId),
    playerName: str(body.playerName, "playerName", { max: 24 }),
    landmarkId: str(String(body.landmarkId ?? ""), "landmarkId", { max: 40 }),
    title: str(body.title, "title", { max: 120 }),
    lat: num(body.lat, "lat", { min: -90, max: 90 }),
    lon: num(body.lon, "lon", { min: -180, max: 180 }),
    pet: {
      id: playerId(pet.id),
      name: str(pet.name, "pet.name", { max: 24 }),
      rarity: oneOf(pet.rarity, "pet.rarity", RARITIES),
      petClass: oneOf(pet.petClass, "pet.petClass", PET_CLASSES),
      color: oneOf(pet.color ?? "snowy", "pet.color", PET_COLOR_NAMES),
      spaceBorn: Boolean(pet.spaceBorn),
      power: Math.floor(num(pet.power, "pet.power", { min: 1, max: 200 })),
      emoji: str(pet.emoji ?? "🐾", "pet.emoji", { max: 8 }),
      art: petArt(pet.art),
    },
  };
}
