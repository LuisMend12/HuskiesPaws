// Pets tab: carry an egg, hatch it by walking, pick an active pet, and use it to
// claim landmarks (turf). Game rules live in pets.js; turf rules on the server.
import { fetchImage, grokAvailable } from "./api.js";
import { creatureSvg } from "./art.js";
import { distanceMeters } from "./geo.js";
import {
  EGG_EVERY_STEPS, ISS_RARITY_BOOST, colorOf, eggProgress, hatchEgg, issIsOverhead, maybeNewEgg, metersToHatch, petLevel,
  petPower, rarityOf, stepsToNextEgg,
} from "./pets.js";
import { stepsFromMeters } from "./rank.js";
import { getIssPosition } from "./services.js";

const CLAIM_RANGE_M = 150; // walking routes end on the nearest path, a bit off the landmark
const ISS_REFRESH_MS = 60_000;
const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// A pet's picture: its Grok Imagine portrait if it has one, else colored SVG art.
function petArt(pet, walked) {
  const holder = el("div", "pet-art");
  if (pet.art) {
    const img = el("img");
    img.src = pet.art; // a server path like /images/abc.png
    img.alt = `${pet.name}, drawn by Grok Imagine`;
    holder.append(img);
  } else {
    const look = { name: pet.name, color: colorOf(pet).hex, leaf: rarityOf(pet).color };
    holder.innerHTML = creatureSvg(look, petLevel(pet, walked)); // generated from our own data
  }
  return holder;
}

// ctx: { getState, update(patch), setStatus, speak(text), online }
export function createPetsUi(ctx) {
  const walkedNow = () => ctx.getState().progress.walked;
  let iss = null; // latest ISS position; null until the first fetch (or if offline)
  const issOverhead = () => issIsOverhead(iss, ctx.getState().position, distanceMeters);

  async function refreshIss() {
    try {
      iss = await getIssPosition();
      render();
    } catch (error) {
      console.warn("ISS position unavailable:", error);
    }
  }

  function nearbyLandmark() {
    const { found, position } = ctx.getState();
    return found
      .map((place) => ({ ...place, distance: distanceMeters(position, place) }))
      .filter((place) => place.distance <= CLAIM_RANGE_M)
      .sort((a, b) => a.distance - b.distance)[0] ?? null;
  }

  const activePet = () => {
    const { pets, activePetId } = ctx.getState();
    return pets.find((p) => p.id === activePetId) ?? pets[0] ?? null;
  };

  async function drawPortrait(pet) {
    if (!grokAvailable()) return;
    try {
      const art = await fetchImage({ kind: "pet", petId: pet.id, rarity: pet.rarity, petClass: pet.petClass, color: pet.color });
      const pets = ctx.getState().pets.map((p) => (p.id === pet.id ? { ...p, art } : p));
      ctx.update({ pets });
      if ($("hatch").open && $("hatch").dataset.petId === pet.id) showHatch({ ...pet, art });
    } catch (error) {
      console.warn("Grok Imagine portrait unavailable:", error);
    }
  }

  function showHatch(pet) {
    const rarity = rarityOf(pet);
    const dialog = $("hatch");
    dialog.dataset.petId = pet.id;
    dialog.style.setProperty("--rarity", rarity.color);
    $("hatch-art").replaceChildren(petArt(pet, walkedNow()));
    $("hatch-rarity").textContent = rarity.label;
    $("hatch-name").textContent = pet.name;
    $("hatch-detail").textContent = `${pet.petClass} · power ${petPower(pet, walkedNow())}${pet.spaceBorn ? " · 🛰️ space-born" : ""}`;
    if (!dialog.open) dialog.showModal();
  }

  // Call after any walking: hands out earned eggs and hatches ready ones.
  function tick() {
    const state = ctx.getState();
    const { walked } = state.progress;
    const steps = stepsFromMeters(walked);
    if (state.egg && eggProgress(state.egg, walked) >= 1) {
      const pet = hatchEgg(state.egg, walked, Math.random, { issOverhead: issOverhead() });
      ctx.update({ egg: null, pets: [pet, ...state.pets], activePetId: state.activePetId ?? pet.id });
      const rarity = rarityOf(pet);
      const space = pet.spaceBorn ? " It hatched while the ISS was overhead! 🛰️" : "";
      ctx.setStatus(`🐣 Your egg hatched! Meet ${pet.name}, a ${rarity.label} ${pet.petClass}.${space}`);
      ctx.speak(`Your egg hatched! Meet ${pet.name}, a ${rarity.label.toLowerCase()} ${pet.petClass.toLowerCase()}!`);
      showHatch(pet);
      drawPortrait(pet);
      return;
    }
    const egg = maybeNewEgg({ ...state, steps, walked });
    if (egg) {
      ctx.update({ egg, eggsReceived: state.eggsReceived + 1 });
      ctx.setStatus("🥚 You found an egg! Keep walking to hatch it.");
    }
  }

  async function claimNearby() {
    const place = nearbyLandmark();
    const pet = activePet();
    if (!place || !pet) return;
    $("btn-claim").disabled = true;
    try {
      const { message, won } = await ctx.online.claim(place, pet, petPower(pet, walkedNow()));
      ctx.setStatus(`${won ? "🏰" : "🛡️"} ${message}`);
      ctx.speak(message);
    } catch (error) {
      console.error("Claim failed:", error);
      ctx.setStatus(`Couldn't claim ${place.title}: ${error.message}`);
    } finally {
      render();
    }
  }

  function renderIss() {
    const banner = $("iss-banner");
    banner.hidden = !issOverhead();
    banner.textContent = `🛰️ The ISS is overhead right now! Eggs that hatch now are ${ISS_RARITY_BOOST}x as likely to be rare. (Live orbital data)`;
  }

  function renderEgg(state) {
    const card = $("egg-card");
    const { walked } = state.progress;
    if (state.egg) {
      const progress = eggProgress(state.egg, walked);
      card.replaceChildren(
        el("div", "egg-emoji", "🥚"),
        el("div", "egg-text", `Walk ${metersToHatch(state.egg, walked)} m more to hatch your egg`),
        Object.assign(el("div", "egg-meter"), { innerHTML: `<div style="width:${Math.round(progress * 100)}%"></div>` }),
      );
      return;
    }
    const steps = stepsFromMeters(walked);
    card.replaceChildren(
      el("div", "egg-emoji egg-empty", "🪺"),
      el("div", "egg-text", `Next egg in ${stepsToNextEgg(steps).toLocaleString()} steps (one every ${EGG_EVERY_STEPS} steps)`),
    );
  }

  function renderPets(state) {
    const active = activePet();
    const walked = state.progress.walked;
    $("pets-empty").hidden = state.pets.length > 0;
    $("pets").replaceChildren(
      ...state.pets.map((pet) => {
        const rarity = rarityOf(pet);
        const card = el("div", `pet-card${pet.id === active?.id ? " active" : ""}`);
        card.style.setProperty("--rarity", rarity.color);
        const pick = el("button", "chip", pet.id === active?.id ? "★ Active" : "Make active");
        pick.disabled = pet.id === active?.id;
        pick.addEventListener("click", () => ctx.update({ activePetId: pet.id }));
        card.append(
          petArt(pet, walked),
          el("div", "pet-name", pet.name),
          el("div", "pet-rarity", rarity.label),
          el("div", "pet-meta", `${pet.petClass} · Lv ${petLevel(pet, walked)} · ⚡${petPower(pet, walked)}${pet.spaceBorn ? " · 🛰️" : ""}`),
          pick,
        );
        return card;
      }),
    );
  }

  function renderTurf(state) {
    const online = ctx.online;
    const place = nearbyLandmark();
    const pet = activePet();
    const button = $("btn-claim");
    button.textContent = place && pet ? `🐾 Claim ${place.title} with ${pet.name}` : "🐾 Claim a landmark";
    button.disabled = !online.available() || !place || !pet;
    $("claim-hint").textContent = !online.available()
      ? "Turf needs the HuskiesPaws server (see server/README.md)."
      : !pet ? "Hatch a pet first: eggs come from walking."
        : !place ? "Walk to a landmark Pip found to claim it."
          : `Your ${pet.name} has power ${petPower(pet, state.progress.walked)}. Stronger pets take landmarks from others.`;
    const { list, myHeldXp } = online.turf();
    $("turf-xp").textContent = myHeldXp ? `+${myHeldXp} XP from landmarks you guard` : "";
    $("turf-list").replaceChildren(
      ...(list.length === 0
        ? [el("li", "hint", "No one guards a landmark yet. Be the first!")]
        : list.map((t) => {
          const li = el("li", t.mine ? "mine" : "");
          li.append(
            el("span", "turf-place", t.title),
            el("span", "turf-meta", `${t.mine ? "You" : t.ownerName} · ${t.pet.name} ⚡${t.pet.power} · ${t.heldXp} XP`),
          );
          return li;
        })),
    );
  }

  function render() {
    const state = ctx.getState();
    renderIss();
    renderEgg(state);
    renderPets(state);
    renderTurf(state);
  }

  $("btn-claim").addEventListener("click", claimNearby);
  $("btn-hatch-close").addEventListener("click", () => $("hatch").close());
  refreshIss();
  setInterval(refreshIss, ISS_REFRESH_MS);

  return { tick, render, activePet, issOverhead };
}
