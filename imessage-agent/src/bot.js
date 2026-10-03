// Wanderlings squad over iMessage: Pip (Scout), Moss (Storyteller), Fern (Pathfinder).
// Platform-independent: handleMessage() gets the text and a send() callback, so it
// runs the same under Photon iMessage, the terminal provider, and tests.
import { AGENTS, choosePlace, expeditionDuration, firstSentences, routeMemo, storyMemo } from "../../prototype/js/agents.js";
import { DEFAULT_CENTER } from "../../prototype/js/config.js";
import { distanceMeters, pathLength } from "../../prototype/js/geo.js";
import { MIN_TRIP_M, estimateRideFare, formatDollars, totalSaved, treeStage } from "../../prototype/js/savings.js";
import { findNearbyPlaces, getPlaceSummary, getWalkingRoute, searchPlace } from "../../prototype/js/services.js";

const [pip, moss, fern] = ["scout", "storyteller", "pathfinder"].map((id) => AGENTS.find((a) => a.id === id));
const DEFAULT_PLACE_NAME = "the Physical Sciences Building at Cornell";

export const HELP = [
  "🌱 Wanderlings squad here! Text:",
  "• \"I'm at <place>\" to tell us where you are",
  "• \"explore\": Pip scouts somewhere new",
  "• \"story\": Moss tells you about what's nearby",
  "• \"take me there\": Fern plans the walk",
  "• \"arrived\": log the walk, and the Uber you skipped grows your savings tree",
  "• \"savings\": see your tree",
].join("\n");

export function newSession() {
  return { position: DEFAULT_CENTER, placeName: DEFAULT_PLACE_NAME, visited: [], discovery: null, pendingTrip: null, trips: [] };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const walkingLink = (p) => `https://maps.apple.com/?daddr=${p.lat},${p.lon}&dirflg=w`;

// Returns the updated session. send({ text }) or send({ imageUrl }) delivers replies.
export async function handleMessage(rawText, session, send) {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  try {
    const location = text.match(/^(?:i'?m at|im at|i am at|at|location:?)\s+(.+)$/i);
    if (location) return await setLocation(location[1], session, send);
    if (/^(hi|hey|hello|start|help|\?)\b/.test(lower)) {
      await send({ text: `${HELP}\n\n(Right now I think you're near ${session.placeName}.)` });
      return session;
    }
    if (/\b(explore|scout|find|discover)\b/.test(lower)) return await explore(session, send);
    if (/\b(story|history|tell me)\b/.test(lower)) return await tellStory(session, send);
    if (/\b(take me|go there|route|directions|guide)\b/.test(lower)) return await guide(session, send);
    if (/\b(arrived|made it|here|i'?m there)\b/.test(lower)) return await arrive(session, send);
    if (/\b(saved|savings|tree)\b/.test(lower)) return await showSavings(session, send);
    await send({ text: `Hmm, I didn't catch that.\n\n${HELP}` });
    return session;
  } catch (error) {
    console.error("Agent failed:", error);
    await send({ text: "Our squad hit a network snag. Try again in a moment! 🌧️" });
    return session;
  }
}

async function setLocation(query, session, send) {
  const found = await searchPlace(query, session.position);
  if (!found) {
    await send({ text: `I couldn't find "${query}" on the map. Try a building or street name.` });
    return session;
  }
  await send({ text: `📍 Got it, you're near ${found.name}. Text "explore" and Pip will scout somewhere new!` });
  return { ...session, position: { lat: found.lat, lon: found.lon }, placeName: found.name };
}

async function explore(session, send) {
  const places = await findNearbyPlaces(session.position);
  const known = new Set([...session.visited, ...(session.discovery ? [session.discovery.place.id] : [])]);
  // Prefer places far enough that you'd otherwise ride there, so walking saves money.
  const place = choosePlace(places, session.position, known, { minDistance: MIN_TRIP_M })
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

async function tellStory(session, send) {
  const [nearest] = (await findNearbyPlaces(session.position))
    .map((p) => ({ ...p, distance: distanceMeters(session.position, p) }))
    .sort((a, b) => a.distance - b.distance);
  if (!nearest) {
    await send({ text: `🍇 ${moss.name} doesn't know any stories about this spot yet.` });
    return session;
  }
  await send({ text: `🍇 ${moss.name}: ${storyMemo(nearest, await getPlaceSummary(nearest.title))}` });
  return session;
}

async function guide(session, send) {
  const place = session.discovery?.place;
  if (!place) {
    await send({ text: `🫐 ${fern.name}: Nothing to guide you to yet. Text "explore" first!` });
    return session;
  }
  const route = await getWalkingRoute(session.position, place);
  const meters = route.distance ?? pathLength(route.points);
  const fare = estimateRideFare(meters);
  const savings = fare ? `\n💰 Walking instead of taking an Uber saves about ${formatDollars(fare)}. Text "arrived" when you get there!` : "";
  await send({ text: `🫐 ${fern.name}: ${routeMemo(place, route)}\n🗺️ ${walkingLink(place)}${savings}` });
  return { ...session, pendingTrip: { place, meters } };
}

async function arrive(session, send) {
  const trip = session.pendingTrip;
  if (!trip) {
    await send({ text: `🫐 ${fern.name}: Arrived where? Text "explore", then "take me there" first.` });
    return session;
  }
  const amount = estimateRideFare(trip.meters);
  const trips = amount ? [...session.trips, { title: trip.place.title, amount }] : session.trips;
  const stage = treeStage(totalSaved(trips)).current;
  const saved = amount ? ` You skipped a ~${formatDollars(amount)} ride, so your savings tree is now a ${stage.emoji} ${stage.name}.` : "";
  await send({ text: `🌸 You made it to ${trip.place.title}!${saved}` });
  return {
    ...session,
    position: { lat: trip.place.lat, lon: trip.place.lon },
    placeName: trip.place.title,
    visited: [...session.visited, trip.place.id],
    discovery: null,
    pendingTrip: null,
    trips,
  };
}

async function showSavings(session, send) {
  const saved = totalSaved(session.trips);
  const { current, next } = treeStage(saved);
  const nextText = next ? ` ${formatDollars(next.min - saved)} more to ${next.emoji} ${next.name}.` : " Fully grown!";
  await send({ text: `🌳 You've saved ${formatDollars(saved)} by walking. Your tree: ${current.emoji} ${current.name}.${nextText}` });
  return session;
}
