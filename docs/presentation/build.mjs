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
  deep: "123252",
};

const ASSETS = {
  icon: path.join(ROOT, "mobile/assets/icon.png"),
  splash: path.join(ROOT, "mobile/assets/splash-icon.png"),
  badge: path.join(ROOT, "mobile/assets/logo-badge.png"),
  bronze: path.join(ROOT, "mobile/assets/badges/bronze.png"),
  silver: path.join(ROOT, "mobile/assets/badges/silver.png"),
  gold: path.join(ROOT, "mobile/assets/badges/gold.png"),
  crystal: path.join(ROOT, "mobile/assets/badges/crystal.png"),
};

function notes(text) {
  return text.trim();
}

function shadow() {
  return { type: "outer", color: "0B1F3A", opacity: 0.1, blur: 8, offset: 2, angle: 90 };
}

function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    rectRadius: 0.12,
    shadow: shadow(),
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
          y: 0.28,
          w: 12.2,
          h: 0.62,
          fontFace: "Calibri",
          fontSize: 32,
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
          y: 7.14,
          w: 12.2,
          h: 0.22,
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

// ── 1. Title ───────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "TITLE_DARK" });
  s.addShape(pres.shapes.OVAL, {
    x: 10.6,
    y: -1.6,
    w: 4.6,
    h: 4.6,
    fill: { color: C.deep },
  });
  s.addShape(pres.shapes.OVAL, {
    x: -1.6,
    y: 5.4,
    w: 3.8,
    h: 3.8,
    fill: { color: C.deep },
  });

  s.addImage({ path: ASSETS.splash, x: 9.35, y: 2.05, w: 3.15, h: 3.15 });
  s.addImage({ path: ASSETS.icon, x: 0.7, y: 1.85, w: 1.15, h: 1.15 });
  s.addText("HuskiesPaws", {
    x: 2.05,
    y: 1.85,
    w: 7.0,
    h: 0.7,
    fontFace: "Calibri",
    fontSize: 44,
    bold: true,
    color: C.white,
    margin: 0,
    valign: "middle",
    isTextBox: true,
  });
  s.addText("Turn everyday walks into a creature-collecting adventure.", {
    x: 2.05,
    y: 2.55,
    w: 7.1,
    h: 0.5,
    fontFace: "Calibri",
    fontSize: 18,
    italic: true,
    color: C.ice,
    margin: 0,
    isTextBox: true,
  });

  card(s, 0.7, 3.85, 7.7, 2.15, C.deep);
  s.addText("BigRed//Hacks 2026  ·  Theme: Navigation", {
    x: 0.95,
    y: 4.05,
    w: 7.2,
    h: 0.4,
    fontFace: "Calibri",
    fontSize: 18,
    color: C.gold,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Luis Mendez  ·  Abdullah Rashid", {
    x: 0.95,
    y: 4.5,
    w: 7.2,
    h: 0.45,
    fontFace: "Calibri",
    fontSize: 22,
    bold: true,
    color: C.white,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Phone app  ·  Expo Go  ·  Built with Cursor", {
    x: 0.95,
    y: 5.05,
    w: 7.2,
    h: 0.35,
    fontFace: "Calibri",
    fontSize: 16,
    color: C.ice,
    margin: 0,
    isTextBox: true,
  });
  s.addNotes(
    notes(`
About 25 seconds. We are HuskiesPaws. Ordinary walks become a creature-collecting adventure. Team is Luis Mendez and Abdullah Rashid, BigRed Hacks 2026, Navigation. The product is the phone app. Invite them to watch the loop.
`)
  );
}

// ── 2. Problem ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("People walk past the interesting places", {
    placeholder: "title",
    isTextBox: true,
  });

  s.addText("Typical navigation", {
    x: 0.55,
    y: 1.02,
    w: 5.85,
    h: 0.32,
    fontFace: "Calibri",
    fontSize: 16,
    bold: true,
    color: C.coral,
    margin: 0,
    isTextBox: true,
  });
  s.addText("What walking could be", {
    x: 6.95,
    y: 1.02,
    w: 5.85,
    h: 0.32,
    fontFace: "Calibri",
    fontSize: 16,
    bold: true,
    color: C.moss,
    margin: 0,
    isTextBox: true,
  });

  const rows = [
    { left: "Get there as fast as possible", right: "Notice the route, not only the pin" },
    { left: "Stay on the shortest path", right: "Named places with real stories" },
    { left: "Put the phone away at the door", right: "Walking earns progress and company" },
  ];
  rows.forEach((row, i) => {
    const y = 1.4 + i * 1.85;
    card(s, 0.55, y, 5.85, 1.65, C.card);
    s.addText(row.left, {
      x: 0.8,
      y: y + 0.35,
      w: 5.35,
      h: 0.95,
      fontFace: "Calibri",
      fontSize: 22,
      bold: true,
      color: C.navy,
      margin: 0,
      valign: "middle",
      isTextBox: true,
    });

    s.addText("→", {
      x: 6.4,
      y: y + 0.5,
      w: 0.5,
      h: 0.55,
      align: "center",
      fontFace: "Calibri",
      fontSize: 24,
      bold: true,
      color: C.green,
      margin: 0,
      isTextBox: true,
    });

    card(s, 6.95, y, 5.85, 1.65, C.leaf);
    s.addText(row.right, {
      x: 7.2,
      y: y + 0.35,
      w: 5.35,
      h: 0.95,
      fontFace: "Calibri",
      fontSize: 22,
      bold: true,
      color: C.ink,
      margin: 0,
      valign: "middle",
      isTextBox: true,
    });
  });
  s.addNotes(
    notes(`
About 25 seconds. Do not invent numbers. Typical maps optimize for arrival. People miss buildings and corners they walk past every day. Walking already happens; discovery and progress do not. That is the gap on campus.
`)
  );
}

// ── 3. Solution ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Explore  →  Walk  →  Discover  →  Collect", {
    placeholder: "title",
    isTextBox: true,
  });

  const steps = [
    { t: "Explore", d: "Pip scouts nearby places from Wikipedia and OpenStreetMap." },
    { t: "Walk", d: "Fern guides the route. The trail blooms as you move." },
    { t: "Discover", d: "Moss tells the grounded story at a real landmark." },
    { t: "Collect", d: "Capture the place. Walking fills eggs and grows the squad." },
  ];
  steps.forEach((step, i) => {
    const x = 0.55 + i * 3.2;
    card(s, x, 1.05, 3.0, 2.7, C.card);
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.12,
      y: 1.22,
      w: 0.72,
      h: 0.72,
      fill: { color: C.green },
    });
    s.addText(String(i + 1), {
      x: x + 1.12,
      y: 1.3,
      w: 0.72,
      h: 0.56,
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
      y: 2.05,
      w: 2.7,
      h: 0.4,
      align: "center",
      fontFace: "Calibri",
      fontSize: 22,
      bold: true,
      color: C.navy,
      margin: 0,
      isTextBox: true,
    });
    s.addText(step.d, {
      x: x + 0.18,
      y: 2.5,
      w: 2.64,
      h: 1.05,
      align: "center",
      fontFace: "Calibri",
      fontSize: 14,
      color: C.muted,
      margin: 0,
      isTextBox: true,
    });
  });

  card(s, 0.55, 3.95, 12.25, 2.9, C.navy);
  const squad = [
    { n: "Pip", r: "Scout", d: "Finds a nearby place and a fact from tools, not guesswork." },
    { n: "Moss", r: "Storyteller", d: "Reads the landmark’s history in a short voice memo." },
    { n: "Fern", r: "Pathfinder", d: "Turns that place into a walk you can follow." },
  ];
  squad.forEach((p, i) => {
    const x = 0.85 + i * 4.0;
    s.addText(p.n, {
      x,
      y: 4.2,
      w: 3.7,
      h: 0.42,
      fontFace: "Calibri",
      fontSize: 24,
      bold: true,
      color: C.gold,
      margin: 0,
      isTextBox: true,
    });
    s.addText(p.r, {
      x,
      y: 4.65,
      w: 3.7,
      h: 0.32,
      fontFace: "Calibri",
      fontSize: 16,
      color: C.ice,
      margin: 0,
      isTextBox: true,
    });
    s.addText(p.d, {
      x,
      y: 5.1,
      w: 3.7,
      h: 1.35,
      fontFace: "Calibri",
      fontSize: 18,
      color: C.white,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addNotes(
    notes(`
About 30 seconds. Loop: Explore, Walk, Discover, Collect. Pip scouts with Wikipedia and OpenStreetMap. Fern starts the walk. Moss tells the story from those facts. Capture and eggs reward the walk. Then go to the live phone.
`)
  );
}

// ── 4. Live demo ───────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("Live demo  —  keep this slide up", {
    placeholder: "title",
    isTextBox: true,
  });

  card(s, 0.55, 1.02, 12.25, 0.7, C.navy);
  s.addText("Demo Walk is ON   ·   steps are simulated at the judging table", {
    x: 0.75,
    y: 1.12,
    w: 11.85,
    h: 0.5,
    align: "center",
    fontFace: "Calibri",
    fontSize: 20,
    bold: true,
    color: C.gold,
    margin: 0,
    valign: "middle",
    isTextBox: true,
  });

  const seq = [
    { n: "1", t: "Send Pip exploring", d: "Squad → Pip → Explore. A nearby place and a fact come back." },
    { n: "2", t: "Choose a place", d: "Open the postcard. That is the landmark for this walk." },
    { n: "3", t: "Start a walk", d: "Fern leads. The trail blooms on the map as Demo Walk runs." },
    { n: "4", t: "Capture", d: "When you arrive, capture the landmark or hatch from the walk." },
  ];
  seq.forEach((step, i) => {
    const x = 0.55 + i * 3.2;
    card(s, x, 1.95, 3.05, 4.85, C.card);
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.1,
      y: 2.2,
      w: 0.85,
      h: 0.85,
      fill: { color: C.green },
    });
    s.addText(step.n, {
      x: x + 1.1,
      y: 2.3,
      w: 0.85,
      h: 0.65,
      align: "center",
      fontFace: "Calibri",
      fontSize: 28,
      bold: true,
      color: C.white,
      margin: 0,
      isTextBox: true,
    });
    s.addText(step.t, {
      x: x + 0.18,
      y: 3.2,
      w: 2.7,
      h: 1.05,
      align: "center",
      fontFace: "Calibri",
      fontSize: 22,
      bold: true,
      color: C.navy,
      margin: 0,
      isTextBox: true,
    });
    s.addText(step.d, {
      x: x + 0.2,
      y: 4.3,
      w: 2.65,
      h: 2.15,
      align: "center",
      fontFace: "Calibri",
      fontSize: 16,
      color: C.muted,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addNotes(
    notes(`
Keep this slide visible. Hand the phone over if they want it. Demo Walk ON — say walks are simulated. Sequence: Squad, Pip, Explore. Pick the postcard. Start walk. Watch the blooming trail. Capture. If Grok is slow, keep going. Hide the Expo tools button. Do not claim a live server unless /api/health is up.
`)
  );
}

// ── 5. Built ───────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("How we built it", {
    placeholder: "title",
    isTextBox: true,
  });

  const boxes = [
    { t: "Phone", d: "Expo SDK 57\nReact Native\nExpo Router" },
    { t: "API", d: "Node.js /api\nSecrets stay here\nTurf + voice + art", dark: true },
    { t: "World", d: "Wikipedia · OSM\nGrok / ElevenLabs\nPhoton iMessage" },
  ];
  boxes.forEach((b, i) => {
    const x = 0.55 + i * 4.4;
    card(s, x, 1.05, 3.7, 2.05, b.dark ? C.navy : C.card);
    s.addText(b.t, {
      x: x + 0.25,
      y: 1.2,
      w: 3.2,
      h: 0.42,
      fontFace: "Calibri",
      fontSize: 22,
      bold: true,
      color: b.dark ? C.gold : C.navy,
      margin: 0,
      isTextBox: true,
    });
    s.addText(b.d, {
      x: x + 0.25,
      y: 1.68,
      w: 3.2,
      h: 1.2,
      fontFace: "Calibri",
      fontSize: 16,
      color: b.dark ? C.white : C.muted,
      margin: 0,
      isTextBox: true,
    });
    if (i < 2) {
      s.addText("→", {
        x: x + 3.7,
        y: 1.7,
        w: 0.7,
        h: 0.5,
        align: "center",
        fontFace: "Calibri",
        fontSize: 26,
        bold: true,
        color: C.green,
        margin: 0,
        isTextBox: true,
      });
    }
  });

  const pills = [
    { t: "Shared JavaScript game logic", d: "core/ is the source of truth. Phone, server, and iMessage import the same rules." },
    { t: "Grounded facts and routes", d: "Place facts from Wikipedia. Walking routes from OpenStreetMap. Agents do not invent landmarks." },
    { t: "Voice and art, with fallbacks", d: "Moss can use ElevenLabs. Pip and Fern can use Grok when keys are set. Else on-device speech and original art." },
    { t: "Cursor-assisted build", d: "SpaceX track: designed and iterated in Cursor. iMessage agent uses Photon Spectrum." },
  ];
  pills.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.55 + col * 6.4;
    const y = 3.35 + row * 1.8;
    card(s, x, y, 6.15, 1.65, C.card);
    s.addText(p.t, {
      x: x + 0.25,
      y: y + 0.18,
      w: 5.65,
      h: 0.4,
      fontFace: "Calibri",
      fontSize: 18,
      bold: true,
      color: C.green,
      margin: 0,
      isTextBox: true,
    });
    s.addText(p.d, {
      x: x + 0.25,
      y: y + 0.62,
      w: 5.65,
      h: 0.85,
      fontFace: "Calibri",
      fontSize: 15,
      color: C.ink,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addNotes(
    notes(`
About 25 seconds. Phone talks to our Node API. Secrets never ship in the app. Wikipedia and OSM ground the adventure. Speech and Imagine are optional. Shared core keeps pets, ranks, and walks consistent. Photon is iMessage. Built in Cursor. Do not say Render is live unless health is green.
`)
  );
}

// ── 6. Special ─────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("What makes it special", {
    placeholder: "title",
    isTextBox: true,
  });

  const strengths = [
    {
      img: ASSETS.splash,
      t: "Navigation becomes play",
      d: "The map is a blooming trail and a squad, not only a blue line to a pin.",
    },
    {
      img: ASSETS.gold,
      t: "Walking earns pets",
      d: "Distance fills eggs, ranks, and landmark captures — completable at the table in Demo Walk.",
    },
    {
      img: ASSETS.badge,
      t: "Lives in iMessage",
      d: "The same squad can explore, story, and route over Photon — terminal today, iMessage with keys.",
    },
  ];
  strengths.forEach((st, i) => {
    const x = 0.55 + i * 4.2;
    card(s, x, 1.05, 3.95, 4.55, C.card);
    s.addImage({
      path: st.img,
      x: x + 1.12,
      y: 1.28,
      w: 1.7,
      h: 1.7,
    });
    s.addText(st.t, {
      x: x + 0.22,
      y: 3.15,
      w: 3.5,
      h: 0.85,
      fontFace: "Calibri",
      fontSize: 20,
      bold: true,
      color: C.navy,
      margin: 0,
      isTextBox: true,
    });
    s.addText(st.d, {
      x: x + 0.22,
      y: 4.05,
      w: 3.5,
      h: 1.3,
      fontFace: "Calibri",
      fontSize: 15,
      color: C.muted,
      margin: 0,
      isTextBox: true,
    });
  });

  card(s, 0.55, 5.8, 6.0, 1.1, C.leaf);
  s.addText("In the app: ISS overhead can boost rare hatches.", {
    x: 0.75,
    y: 5.95,
    w: 5.6,
    h: 0.8,
    fontFace: "Calibri",
    fontSize: 16,
    color: C.ink,
    margin: 0,
    valign: "middle",
    isTextBox: true,
  });
  card(s, 6.8, 5.8, 6.0, 1.1, C.card);
  s.addText("Not claimed today: live Grok without a key, cloud deploy, background tracking.", {
    x: 7.0,
    y: 5.95,
    w: 5.6,
    h: 0.8,
    fontFace: "Calibri",
    fontSize: 16,
    color: C.muted,
    margin: 0,
    valign: "middle",
    isTextBox: true,
  });
  s.addNotes(
    notes(`
About 25 seconds. Three things they saw: navigation is play; walking earns creatures; the squad can live in iMessage. ISS rare-hatch boost is in shared logic. Be honest about Grok keys, deploy, and background GPS.
`)
  );
}

// ── 7. Close ───────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CLOSE_DARK" });
  s.addText("Walk more of the world you already live in", {
    x: 0.7,
    y: 0.35,
    w: 12,
    h: 0.6,
    fontFace: "Calibri",
    fontSize: 30,
    bold: true,
    color: C.white,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Campus, hometown blocks, and the path between classes — same loop.", {
    x: 0.7,
    y: 0.95,
    w: 12,
    h: 0.38,
    fontFace: "Calibri",
    fontSize: 18,
    color: C.ice,
    margin: 0,
    isTextBox: true,
  });
  s.addText("What’s next  ·  planned, not shipped", {
    x: 0.7,
    y: 1.5,
    w: 12,
    h: 0.35,
    fontFace: "Calibri",
    fontSize: 16,
    bold: true,
    color: C.gold,
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
    const y = 1.95 + Math.floor(i / 2) * 1.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y,
      w: 5.85,
      h: 1.3,
      fill: { color: C.deep },
      rectRadius: 0.12,
    });
    s.addText(n.t, {
      x: x + 0.25,
      y: y + 0.16,
      w: 5.35,
      h: 0.38,
      fontFace: "Calibri",
      fontSize: 18,
      bold: true,
      color: C.gold,
      margin: 0,
      isTextBox: true,
    });
    s.addText(n.d, {
      x: x + 0.25,
      y: y + 0.58,
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
    y: 5.05,
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
    y: 5.6,
    w: 12,
    h: 0.42,
    fontFace: "Calibri",
    fontSize: 20,
    color: C.white,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Luis Mendez  ·  Abdullah Rashid  ·  HuskiesPaws", {
    x: 0.7,
    y: 6.75,
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
About 25 seconds. Close on campus exploration — not inflated stats. Next is planned: background tracking, accessibility, a deploy that stays awake, richer social play. Line: Everyday walks. Extraordinary company. Hand them the phone.
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
