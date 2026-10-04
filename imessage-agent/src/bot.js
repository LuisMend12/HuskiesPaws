// HuskiesPaws squad over iMessage. Roles: Scout explores, Storyteller tells stories,
// Pathfinder guides. Each role uses the name of your squad pet of that class in the
// app (synced through /api/day), else the starter (Pip, Moss, Fern).
// Platform-independent: handleMessage() gets the text and a send() callback, so it
// runs the same under Photon iMessage, the terminal provider, and tests.
// Optional { tts } (createSquadTts: ElevenLabs for Moss, Grok Voice for Pip and Fern)
// lets each story follow with a voice note.
import { AGENTS, choosePlace, expeditionDuration, firstSentences, routeMemo, storyMemo } from "../../core/agents.js";
import { DEFAULT_CENTER } from "../../core/config.js";
import { addDayPlace, addDaySteps, emptyDay, formatDayUpdate, rollDay } from "../../core/dayLog.js";
import { distanceMeters, pathLength } from "../../core/geo.js";
import { stepsFromMeters } from "../../core/rank.js";
import { findNearbyPlaces, getPlaceSummary, getWalkingRoute, searchPlace } from "../../core/services.js";

const [pip, moss, fern] = ["scout", "storyteller", "pathfinder"].map((id) => AGENTS.find((a) => a.id === id));
const DEFAULT_PLACE_NAME = "the Physical Sciences Building at Cornell";
export const VOICE_NOTE_NAME = "moss-story.mp3";

const SQUAD_REFRESH_MS = 30_000;

// The squad as the bot speaks it: each role named after your squad pet of that
// class (session.squad comes from the app), with the role's own voice.
export function crewOf(session = {}) {
  const squad = session.squad ?? [];
  const named = (agent, petClass) => {
    const pet = squad.find((p) => p.petClass === petClass);
    return pet ? { ...agent, name: pet.name } : agent;
  };
  return { scout: named(pip, "Scout"), storyteller: named(moss, "Storyteller"), pathfinder: named(fern, "Pathfinder") };
}

export function helpText(crew = crewOf()) {
  const { scout, storyteller, pathfinder } = crew;
  return [
    "🐾 HuskiesPaws squad here! Text:",
    "• \"I'm at <place>\" to tell us where you are",
    `• "explore": ${scout.name} scouts somewhere new`,
    `• "story": ${storyteller.name} tells you about what's nearby (voice note)`,
    `• "${scout.name.toLowerCase()} story" / "${pathfinder.name.toLowerCase()} story": ${scout.name} or ${pathfinder.name} tell it instead`,
    `• "take me there": ${pathfinder.name} plans the walk`,
    "• \"arrived\": log the walk",
    `• "today": ${scout.name} lists places you passed and today's step count`,
  ].join("\n");
}

// The starter squad's help (before any app data arrives).
export const HELP = helpText();

// Picks up the app's squad (names) from the server, at most every 30 s.
async function withSquad(session, dayApi, phone) {
  if (!dayApi?.getDay || !phone || Date.now() - (session.squadAt ?? 0) < SQUAD_REFRESH_MS) return session;
  try {
    const remote = await dayApi.getDay(phone);
    return { ...session, squad: remote?.squad ?? session.squad ?? null, squadAt: Date.now() };
  } catch {
    return { ...session, squadAt: Date.now() };
  }
}

export function newSession() {
  return {
    position: DEFAULT_CENTER,
    placeName: DEFAULT_PLACE_NAME,
    visited: [],
    discovery: null,
    pendingTrip: null,
    dayLog: emptyDay(),
    squad: null, // [{ name, petClass, species }] from the app
    squadAt: 0,
  };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const walkingLink = (p) => `https://maps.apple.com/?daddr=${p.lat},${p.lon}&dirflg=w`;

// Returns the updated session. send({ text }), send({ imageUrl }) or
// send({ audio: Buffer, mimeType, name }) delivers replies.
export async function handleMessage(rawText, rawSession, send, { tts, dayApi, phone } = {}) {
  const session = await withSquad(rawSession, dayApi, phone);
  const crew = crewOf(session);
  const text = rawText.trim();
  const lower = text.toLowerCase();
  try {
    const location = text.match(/^(?:i'?m at|im at|i am at|at|location:?)\s+(.+)$/i);
    if (location) return await setLocation(location[1], session, send, crew);
    if (/^(hi|hey|hello|start|help|\?)\b/.test(lower)) {
      await send({ text: `${helpText(crew)}\n\n(Right now I think you're near ${session.placeName}.)` });
      return session;
    }
    if (/^(today|steps|tally)\b/.test(lower) || /how many steps/.test(lower)) {
      return await todayTally(session, send, dayApi, phone);
    }
    if (/\b(explore|scout|find|discover)\b/.test(lower)) return await explore(session, send, crew);
    if (/\b(story|history|tell me)\b/.test(lower)) return await tellStory(session, send, tts, lower, crew);
    if (/\b(take me|go there|route|directions|guide)\b/.test(lower)) return await guide(session, send, crew);
    if (/\b(arrived|made it|i'?m there)\b/.test(lower)) return await arrive(session, send, dayApi, phone, crew);
    await send({ text: `Hmm, I didn't catch that.\n\n${helpText(crew)}` });
    return session;
  } catch (error) {
    console.error("Agent failed:", error);
    await send({ text: "Our squad hit a network snag. Try again in a moment! 🌧️" });
    return session;
  }
}

async function setLocation(query, session, send, crew) {
  const found = await searchPlace(query, session.position);
  if (!found) {
    await send({ text: `I couldn't find "${query}" on the map. Try a building or street name.` });
    return session;
  }
  await send({ text: `📍 Got it, you're near ${found.name}. Text "explore" and ${crew.scout.name} will scout somewhere new!` });
  return { ...session, position: { lat: found.lat, lon: found.lon }, placeName: found.name };
}

const WALK_WORTHY_M = 300; // prefer places that make a real walk

async function explore(session, send, { scout: pip } = crewOf(session)) {
  const places = await findNearbyPlaces(session.position);
  const known = new Set([...session.visited, ...(session.discovery ? [session.discovery.place.id] : [])]);
  const place = choosePlace(places, session.position, known, { minDistance: WALK_WORTHY_M })
    ?? choosePlace(places, session.position, known);
  if (!place) {
    await send({ text: `${pip.name} couldn't find anywhere new nearby. Tell me a new spot with "I'm at <place>".` });
    return session;
  }
  await send({ text: `🍊 ${pip.name} is heading out to explore… back soon!` });
  const [summary] = await Promise.all([getPlaceSummary(place.title), wait(expeditionDuration(place.distance))]);
  const meters = Math.round(place.distance / 10) * 10;
  await send({ text: `🍊 ${pip.name}: I'm back! I found ${place.title}, about ${meters} m away. ${firstSentences(summary.extract, 1)}` });
  if (summary.photo) await send({ imageUrl: summary.photo });
  await send({ text: `Want to go? Text "take me there". (Source: ${summary.url})` });
  return { ...session, discovery: { place, summary } };
}

// "pip story" / "<your scout's name> story" / "scout story" pick who tells it.
const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function storyAgent(lower, crew) {
  const said = (agent, words) => new RegExp(`\\b(${escapeRe(agent.name.toLowerCase())}|${words})\\b`).test(lower);
  if (said(crew.scout, "scout|pip")) return crew.scout;
  if (said(crew.pathfinder, "pathfinder|fern")) return crew.pathfinder;
  return crew.storyteller;
}

async function tellStory(session, send, tts, lower = "", crew = crewOf(session)) {
  const agent = storyAgent(lower, crew);
  const [nearest] = (await findNearbyPlaces(session.position))
    .map((p) => ({ ...p, distance: distanceMeters(session.position, p) }))
    .sort((a, b) => a.distance - b.distance);
  if (!nearest) {
    await send({ text: `${agent.name} doesn't know any stories about this spot yet.` });
    return session;
  }
  const story = storyMemo(nearest, await getPlaceSummary(nearest.title), agent.id);
  await send({ text: `${agent.name}: ${story}` });
  await sendVoiceNote(story, tts, send, agent);
  return session;
}

async function sendVoiceNote(story, tts, send, agent) {
  if (!tts?.enabled) return;
  try {
    const { audio, contentType } = await tts.speak(story, agent.id, agent.grokVoice);
    await send({ audio, mimeType: contentType, name: agent.id === "storyteller" ? VOICE_NOTE_NAME : `${agent.id}-story.mp3` });
  } catch (error) {
    console.error(`${agent.name}'s voice note failed:`, error);
  }
}

async function guide(session, send, { pathfinder: fern } = crewOf(session)) {
  const place = session.discovery?.place;
  if (!place) {
    await send({ text: `🫐 ${fern.name}: Nothing to guide you to yet. Text "explore" first!` });
    return session;
  }
  const route = await getWalkingRoute(session.position, place);
  const meters = route.distance ?? pathLength(route.points);
  await send({ text: `🫐 ${fern.name}: ${routeMemo(place, route)}\n🗺️ ${walkingLink(place)}\nText "arrived" when you get there!` });
  return { ...session, pendingTrip: { place, meters } };
}

async function arrive(session, send, dayApi, phone, { pathfinder: fern } = crewOf(session)) {
  const trip = session.pendingTrip;
  if (!trip) {
    await send({ text: `🫐 ${fern.name}: Arrived where? Text "explore", then "take me there" first.` });
    return session;
  }
  const dayLog = addDaySteps(addDayPlace(rollDay(session.dayLog), trip.place), stepsFromMeters(trip.meters));
  await send({ text: `🌸 You made it to ${trip.place.title}!` });
  await send({ text: formatDayUpdate(dayLog) });
  const next = {
    ...session,
    position: { lat: trip.place.lat, lon: trip.place.lon },
    placeName: trip.place.title,
    visited: [...session.visited, trip.place.id],
    discovery: null,
    pendingTrip: null,
    dayLog,
  };
  await syncDay(next, dayApi, phone);
  return next;
}

async function todayTally(session, send, dayApi, phone) {
  const remote = phone && dayApi?.getDay ? await dayApi.getDay(phone) : null;
  const dayLog = remote?.date ? remote : rollDay(session.dayLog);
  await send({ text: formatDayUpdate(dayLog) });
  return { ...session, dayLog };
}

async function syncDay(session, dayApi, phone) {
  if (!dayApi?.putDay || !phone) return;
  await dayApi.putDay({
    phone,
    steps: session.dayLog?.steps ?? 0,
    places: session.dayLog?.places ?? [],
  });
}
