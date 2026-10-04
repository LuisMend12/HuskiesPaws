import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(
  "C:/Users/Luis Mendez/.claude/skills/synced/e9c4f8fe-33fe-4afd-812e-c349206e6a34_e12b8f7d-5d15-4e43-84a0-9ccbb09bffc5/pptx/scripts/apply_theme.js"
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(__dirname, "HuskiesPaws-BigRedHacks-2026.pptx");

const C = {
  navy: "0B1F3A",
  cream: "F6F1E4",
  green: "2E9D4F",
  ice: "6EC6FF",
  coral: "FF7A59",
  gold: "E8A317",
  white: "FFFFFF",
  moss: "1F6B45",
  ink: "163528",
  muted: "4A6358",
  card: "FFFFFF",
  leaf: "E7F3E4",
};

const ASSETS = {
  icon: path.join(ROOT, "mobile/assets/icon.png"),
  splash: path.join(ROOT, "mobile/assets/splash-icon.png"),
  badge: path.join(ROOT, "mobile/assets/logo-badge.png"),
  bronze: path.join(ROOT, "mobile/assets/badges/bronze.png"),
  silver: path.join(ROOT, "mobile/assets/badges/silver.png"),
  gold: path.join(ROOT, "mobile/assets/badges/gold.png"),
  diamond: path.join(ROOT, "mobile/assets/badges/diamond.png"),
  crystal: path.join(ROOT, "mobile/assets/badges/crystal.png"),
  map: path.join(__dirname, "assets/placeholder-map.png"),
  walk: path.join(__dirname, "assets/placeholder-walk.png"),
  capture: path.join(__dirname, "assets/placeholder-capture.png"),
};

function notes(text) {
  return text.trim();
}

function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    rectRadius: 0.14,
    shadow: { type: "outer", color: "0B1F3A", opacity: 0.08, blur: 10, offset: 3, angle: 90 },
  });
}

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";
pres.author = "Luis Mendez, Abdullah Rashid";
pres.title = "HuskiesPaws — BigRed//Hacks 2026";
pres.subject = "Navigation-themed demo deck";
pres.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };

pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: C.navy },
  objects: [],
});

pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.cream },
  objects: [
    {
      placeholder: {
        options: {
          name: "title",
          type: "title",
          x: 0.55,
          y: 0.32,
          w: 12.2,
          h: 0.7,
          fontFace: "Calibri",
          fontSize: 36,
          bold: true,
          color: C.navy,
          margin: 0,
          align: "left",
          valign: "middle",
        },
        text: "",
      },
    },
    {
      text: {
        text: "HuskiesPaws  ·  BigRed//Hacks 2026",
        options: {
          x: 0.55,
          y: 7.12,
          w: 8,
          h: 0.24,
          fontFace: "Calibri",
          fontSize: 11,
          color: C.muted,
          margin: 0,
        },
      },
    },
  ],
});

pres.defineSlideMaster({
  title: "CLOSE_DARK",
  background: { color: C.navy },
  objects: [],
});

// ── Slide 1 ────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "TITLE_DARK" });
  s.addShape(pres.shapes.OVAL, {
    x: 10.4,
    y: -1.4,
    w: 4.4,
    h: 4.4,
    fill: { color: "123252" },
  });
  s.addShape(pres.shapes.OVAL, {
    x: -1.2,
    y: 5.2,
    w: 3.6,
    h: 3.6,
    fill: { color: "123252" },
  });
  s.addImage({ path: ASSETS.icon, x: 0.7, y: 1.55, w: 1.35, h: 1.35 });
  s.addText("HuskiesPaws", {
    x: 2.2,
    y: 1.55,
    w: 10,
    h: 0.85,
    fontFace: "Calibri",
    fontSize: 48,
    bold: true,
    color: C.white,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Turn everyday walks into a creature-collecting adventure.", {
    x: 2.2,
    y: 2.45,
    w: 10.2,
    h: 0.7,
    fontFace: "Calibri",
    fontSize: 24,
    italic: true,
    color: C.ice,
    margin: 0,
    isTextBox: true,
  });
  s.addText("BigRed//Hacks 2026  ·  Theme: Navigation", {
    x: 0.7,
    y: 4.35,
    w: 8,
    h: 0.4,
    fontFace: "Calibri",
    fontSize: 18,
    color: C.gold,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Luis Mendez  ·  Abdullah Rashid", {
    x: 0.7,
    y: 4.85,
    w: 8,
    h: 0.4,
    fontFace: "Calibri",
    fontSize: 20,
    color: C.white,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Phone app  ·  Expo Go demo  ·  Built with Cursor", {
    x: 0.7,
    y: 6.55,
    w: 10,
    h: 0.35,
    fontFace: "Calibri",
    fontSize: 14,
    color: "9BB0C4",
    margin: 0,
    isTextBox: true,
  });
  s.addNotes(
    notes(`
About 25 seconds. Open on the title. Say: We are HuskiesPaws. Ordinary walks become a creature-collecting adventure. Team is Luis Mendez and Abdullah Rashid, BigRed Hacks 2026, Navigation track. The product is the phone app you can hold. Invite them to watch the loop, not a website.
`)
  );
}

// ── Slide 2 ────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("People walk past the interesting places", {
    placeholder: "title",
    isTextBox: true,
  });
  card(s, 0.55, 1.25, 6.0, 5.35, C.card);
  s.addText("Typical navigation", {
    x: 0.85,
    y: 1.5,
    w: 5.4,
    h: 0.4,
    fontFace: "Calibri",
    fontSize: 20,
    bold: true,
    color: C.navy,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Get there fast.\nStay on the shortest path.\nPut the phone away at the door.", {
    x: 0.85,
    y: 2.1,
    w: 5.4,
    h: 1.8,
    fontFace: "Calibri",
    fontSize: 20,
    color: C.muted,
    margin: 0,
    valign: "top",
    isTextBox: true,
  });
  s.addText("Little reason to look around on the way.", {
    x: 0.85,
    y: 4.3,
    w: 5.4,
    h: 1.6,
    fontFace: "Calibri",
    fontSize: 18,
    italic: true,
    color: C.coral,
    margin: 0,
    isTextBox: true,
  });

  card(s, 6.85, 1.25, 5.95, 5.35, C.leaf);
  s.addText("What walking could be", {
    x: 7.15,
    y: 1.5,
    w: 5.4,
    h: 0.4,
    fontFace: "Calibri",
    fontSize: 20,
    bold: true,
    color: C.moss,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Campus and neighborhoods are full of named places with real stories.\n\nWalking is already happening. Discovery and progress are not.", {
    x: 7.15,
    y: 2.1,
    w: 5.35,
    h: 3.8,
    fontFace: "Calibri",
    fontSize: 20,
    color: C.ink,
    margin: 0,
    valign: "top",
    isTextBox: true,
  });
  s.addNotes(
    notes(`
About 25 seconds. Do not invent numbers. Typical maps optimize for arrival. People miss buildings, plaques, and corners they walk past every day. Walking is healthy and social; the missing piece is a reason to notice the route. That is the gap we designed for on campus.
`)
  );
}

// ── Slide 3 ────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Explore  →  Walk  →  Discover  →  Collect", {
    placeholder: "title",
    isTextBox: true,
  });

  const steps = [
    { t: "Explore", d: "Pip scouts nearby places from Wikipedia and OpenStreetMap." },
    { t: "Walk", d: "Fern guides the route. The trail blooms as you move — or in labeled demo walk." },
    { t: "Discover", d: "Moss tells the grounded story. You arrive at a real landmark." },
    { t: "Collect", d: "Capture the place. Walking fills eggs and grows your squad." },
  ];
  steps.forEach((step, i) => {
    const x = 0.55 + i * 3.2;
    card(s, x, 1.2, 3.0, 2.85, C.card);
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.1,
      y: 1.4,
      w: 0.7,
      h: 0.7,
      fill: { color: C.green },
    });
    s.addText(String(i + 1), {
      x: x + 1.1,
      y: 1.48,
      w: 0.7,
      h: 0.55,
      align: "center",
      fontFace: "Calibri",
      fontSize: 22,
      bold: true,
      color: C.white,
      margin: 0,
      isTextBox: true,
    });
    s.addText(step.t, {
      x: x + 0.15,
      y: 2.2,
      w: 2.7,
      h: 0.4,
      align: "center",
      fontFace: "Calibri",
      fontSize: 20,
      bold: true,
      color: C.navy,
      margin: 0,
      isTextBox: true,
    });
    s.addText(step.d, {
      x: x + 0.18,
      y: 2.65,
      w: 2.64,
      h: 1.2,
      align: "center",
      fontFace: "Calibri",
      fontSize: 14,
      color: C.muted,
      margin: 0,
      isTextBox: true,
    });
  });

  card(s, 0.55, 4.25, 12.25, 2.5, C.navy);
  const squad = [
    { n: "Pip", r: "Scout", d: "Finds a nearby place and a fact from tools, not guesswork." },
    { n: "Moss", r: "Storyteller", d: "Reads the landmark’s history in a short voice memo." },
    { n: "Fern", r: "Pathfinder", d: "Turns that place into a walk you can follow." },
  ];
  squad.forEach((p, i) => {
    const x = 0.8 + i * 4.0;
    s.addText(p.n, {
      x,
      y: 4.45,
      w: 3.7,
      h: 0.4,
      fontFace: "Calibri",
      fontSize: 22,
      bold: true,
      color: C.gold,
      margin: 0,
      isTextBox: true,
    });
    s.addText(p.r, {
      x,
      y: 4.85,
      w: 3.7,
      h: 0.3,
      fontFace: "Calibri",
      fontSize: 14,
      color: C.ice,
      margin: 0,
      isTextBox: true,
    });
    s.addText(p.d, {
      x,
      y: 5.25,
      w: 3.7,
      h: 1.15,
      fontFace: "Calibri",
      fontSize: 16,
      color: C.white,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addNotes(
    notes(`
About 30 seconds. The loop is Explore, Walk, Discover, Collect. Pip scouts with Wikipedia and OpenStreetMap. Fern starts the walk. Moss tells the story from those facts. Capture and eggs reward the walk. Squad names are starters; your own pets can take those roles. Keep it visual — then go to the live phone.
`)
  );
}

// ── Slide 4 ────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Live demo  ·  leave this slide up", {
    placeholder: "title",
    isTextBox: true,
  });

  const shots = [
    { img: ASSETS.map, cap: "Nearby landmark" },
    { img: ASSETS.walk, cap: "Walk / trail  ·  Demo Walk" },
    { img: ASSETS.capture, cap: "Capture / pet reward" },
  ];
  shots.forEach((shot, i) => {
    const x = 0.55 + i * 4.2;
    s.addImage({
      path: shot.img,
      x: x + 0.55,
      y: 1.15,
      w: 2.55,
      h: 4.53,
      rounding: true,
    });
    s.addText(shot.cap, {
      x,
      y: 5.75,
      w: 3.7,
      h: 0.35,
      align: "center",
      fontFace: "Calibri",
      fontSize: 14,
      bold: true,
      color: C.navy,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addText(
    "Sequence: Send Pip exploring  →  choose a place  →  start a walk  →  capture the landmark.  Demo Walk simulates steps at the judging table.",
    {
      x: 0.55,
      y: 6.15,
      w: 12.2,
      h: 0.7,
      fontFace: "Calibri",
      fontSize: 16,
      color: C.ink,
      margin: 0,
      isTextBox: true,
    }
  );
  s.addNotes(
    notes(`
Keep this slide visible. Hand the phone over if they want it. Demo Walk ON — say that walks are simulated at the table. Sequence: Squad, Pip, Explore. Pick the postcard. Start walk. Watch the blooming trail. Capture. If Grok or voice is slow, keep going — on-device speech and drawn art still work. Hide the Expo tools button. Do not claim a live server unless /api/health is actually up.
`)
  );
}

// ── Slide 5 ────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("How we built it", {
    placeholder: "title",
    isTextBox: true,
  });

  const boxes = [
    { x: 0.55, t: "Phone", d: "Expo SDK 57\nReact Native\nExpo Router" },
    { x: 4.85, t: "API", d: "Node.js /api\nSecrets stay here\nTurf + voice + art" },
    { x: 9.15, t: "World", d: "Wikipedia · OSM\nGrok / ElevenLabs\nPhoton iMessage" },
  ];
  boxes.forEach((b, i) => {
    card(s, b.x, 1.2, 3.65, 2.15, i === 1 ? C.navy : C.card);
    s.addText(b.t, {
      x: b.x + 0.2,
      y: 1.35,
      w: 3.25,
      h: 0.4,
      fontFace: "Calibri",
      fontSize: 22,
      bold: true,
      color: i === 1 ? C.gold : C.navy,
      margin: 0,
      isTextBox: true,
    });
    s.addText(b.d, {
      x: b.x + 0.2,
      y: 1.8,
      w: 3.25,
      h: 1.35,
      fontFace: "Calibri",
      fontSize: 16,
      color: i === 1 ? C.white : C.muted,
      margin: 0,
      isTextBox: true,
    });
    if (i < 2) {
      s.addText("→", {
        x: b.x + 3.5,
        y: 1.9,
        w: 0.5,
        h: 0.5,
        fontFace: "Calibri",
        fontSize: 28,
        bold: true,
        color: C.green,
        margin: 0,
        isTextBox: true,
      });
    }
  });

  const pills = [
    { t: "Shared JavaScript game logic", d: "core/ is the source of truth. Phone, server, and iMessage import the same rules." },
    { t: "Grounded facts and routes", d: "Place facts come from Wikipedia. Walking routes come from OpenStreetMap. Agents do not invent landmarks." },
    { t: "Voice and art, with fallbacks", d: "Moss can use ElevenLabs. Pip and Fern can use Grok Voice and Imagine when keys are set. Otherwise on-device speech and original SVG art." },
    { t: "Cursor-assisted build", d: "SpaceX track: designed and iterated in Cursor. iMessage agent uses Photon Spectrum." },
  ];
  pills.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.55 + col * 6.4;
    const y = 3.55 + row * 1.55;
    card(s, x, y, 6.15, 1.4, C.card);
    s.addText(p.t, {
      x: x + 0.2,
      y: y + 0.12,
      w: 5.75,
      h: 0.35,
      fontFace: "Calibri",
      fontSize: 16,
      bold: true,
      color: C.green,
      margin: 0,
      isTextBox: true,
    });
    s.addText(p.d, {
      x: x + 0.2,
      y: y + 0.5,
      w: 5.75,
      h: 0.75,
      fontFace: "Calibri",
      fontSize: 14,
      color: C.ink,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addNotes(
    notes(`
About 25 seconds. Phone talks to our Node API. Secrets never ship in the app. Wikipedia and OSM ground the adventure. Speech and Imagine are optional — we demo with fallbacks if keys or the server are down. Shared core keeps pets, ranks, and walks consistent. Photon is the iMessage track. Built in Cursor. Do not say we are live on Render unless health checks green today.
`)
  );
}

// ── Slide 6 ────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("What makes it special", {
    placeholder: "title",
    isTextBox: true,
  });

  const strengths = [
    { img: ASSETS.splash, t: "Navigation becomes play", d: "The map is a blooming trail and a squad, not only a blue line to a pin." },
    { img: ASSETS.gold, t: "Walking earns creatures", d: "Distance fills eggs, ranks, and landmark captures you can actually complete at the table in Demo Walk." },
    { img: ASSETS.icon, t: "The walk continues in iMessage", d: "The same squad can explore, story, and route over Photon Spectrum — terminal today, iMessage with keys." },
  ];
  strengths.forEach((st, i) => {
    const x = 0.55 + i * 4.2;
    card(s, x, 1.2, 3.95, 4.35, C.card);
    s.addImage({
      path: st.img,
      x: x + 1.15,
      y: 1.4,
      w: 1.65,
      h: 1.65,
    });
    s.addText(st.t, {
      x: x + 0.2,
      y: 3.2,
      w: 3.55,
      h: 0.85,
      fontFace: "Calibri",
      fontSize: 20,
      bold: true,
      color: C.navy,
      margin: 0,
      isTextBox: true,
    });
    s.addText(st.d, {
      x: x + 0.2,
      y: 4.1,
      w: 3.55,
      h: 1.2,
      fontFace: "Calibri",
      fontSize: 15,
      color: C.muted,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addText(
    "Also in the app: ISS overhead can boost rare hatches.  Experiments, not claims: live Grok without a key, cloud deploy, background tracking.",
    {
      x: 0.55,
      y: 5.7,
      w: 12.2,
      h: 1.1,
      fontFace: "Calibri",
      fontSize: 15,
      color: C.ink,
      margin: 0,
      isTextBox: true,
    }
  );
  s.addNotes(
    notes(`
About 25 seconds. Three things they just saw: navigation is exploration plus progression; walking is the currency for pets and captures; the squad can live in iMessage. Mention ISS only if you want a sparkle — it is implemented in shared logic with live orbital data, not a fake stat. Be honest about Grok keys, deploy, and background GPS. Sample pets on the map are labeled samples.
`)
  );
}

// ── Slide 7 ────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CLOSE_DARK" });
  s.addText("Walk more of the world you already live in", {
    x: 0.7,
    y: 0.45,
    w: 12,
    h: 0.7,
    fontFace: "Calibri",
    fontSize: 32,
    bold: true,
    color: C.white,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Campus, hometown blocks, and the path between classes — same loop.", {
    x: 0.7,
    y: 1.15,
    w: 12,
    h: 0.4,
    fontFace: "Calibri",
    fontSize: 18,
    color: C.ice,
    margin: 0,
    isTextBox: true,
  });

  const next = [
    { t: "Background tracking", d: "Keep the walk honest when the phone is in a pocket." },
    { t: "Accessibility", d: "Clearer motion, voice, and contrast for more walkers." },
    { t: "Reliable deploy", d: "Wake the API so Grok and turf stay up for a whole event." },
    { t: "Social exploration", d: "Richer shared landmarks without turning it into a grind." },
  ];
  next.forEach((n, i) => {
    const x = 0.7 + (i % 2) * 6.2;
    const y = 1.8 + Math.floor(i / 2) * 1.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y,
      w: 5.85,
      h: 1.4,
      fill: { color: "123252" },
      rectRadius: 0.12,
    });
    s.addText(n.t, {
      x: x + 0.25,
      y: y + 0.18,
      w: 5.35,
      h: 0.4,
      fontFace: "Calibri",
      fontSize: 18,
      bold: true,
      color: C.gold,
      margin: 0,
      isTextBox: true,
    });
    s.addText(n.d, {
      x: x + 0.25,
      y: y + 0.62,
      w: 5.35,
      h: 0.55,
      fontFace: "Calibri",
      fontSize: 16,
      color: C.white,
      margin: 0,
      isTextBox: true,
    });
  });

  s.addText("Everyday walks. Extraordinary company.", {
    x: 0.7,
    y: 5.15,
    w: 12,
    h: 0.5,
    fontFace: "Calibri",
    fontSize: 24,
    italic: true,
    color: C.ice,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Try it on the phone. Ask us anything.", {
    x: 0.7,
    y: 5.75,
    w: 12,
    h: 0.45,
    fontFace: "Calibri",
    fontSize: 20,
    color: C.white,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Luis Mendez  ·  Abdullah Rashid  ·  HuskiesPaws", {
    x: 0.7,
    y: 6.7,
    w: 12,
    h: 0.3,
    fontFace: "Calibri",
    fontSize: 14,
    color: "9BB0C4",
    margin: 0,
    isTextBox: true,
  });
  s.addNotes(
    notes(`
About 25 seconds. Close on campus exploration and enjoyable walking — not inflated impact stats. Next is planned: background tracking, accessibility, a deploy that stays awake, richer social play. Line: Everyday walks. Extraordinary company. Hand them the phone. Stop talking so they can ask questions.
`)
  );
}

await pres.writeFile({ fileName: OUT });
await applyTheme(OUT, {
  name: "HuskiesPaws",
  colors: {
    dk1: C.navy,
    lt1: C.cream,
    dk2: C.ink,
    lt2: C.leaf,
    accent1: C.green,
    accent2: C.ice,
    accent3: C.gold,
    accent4: C.coral,
    accent5: C.moss,
    accent6: "7D8CA3",
    hlink: C.ice,
    folHlink: C.green,
  },
});
console.log("Wrote", OUT);
