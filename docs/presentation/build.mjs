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
const ART = path.join(__dirname, "assets");
const SHOTS = path.join(__dirname, "app_images");

const HEX = {
  forest: "163528",
  cream: "F6F1E4",
  navy: "0B1F3A",
  leaf: "E6F4EA",
  green: "2E9D4F",
  ice: "6EC6FF",
  gold: "E8A317",
  coral: "FF7A59",
  moss: "237A3D",
  slate: "5B6B82",
  iceSoft: "E8F5FF",
  white: "FFFFFF",
};

const THEME = {
  name: "HuskiesPaws",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: HEX.forest,
    lt1: HEX.cream,
    dk2: HEX.navy,
    lt2: HEX.leaf,
    accent1: HEX.green,
    accent2: HEX.ice,
    accent3: HEX.gold,
    accent4: HEX.coral,
    accent5: HEX.moss,
    accent6: HEX.slate,
    hlink: HEX.ice,
    folHlink: HEX.green,
  },
};

const FILE = {
  splash: path.join(ROOT, "mobile/assets/splash-icon.png"),
  pip: path.join(ART, "scout.png"),
  moss: path.join(ART, "storyteller.png"),
  fern: path.join(ART, "pathfinder.png"),
  gold: path.join(ROOT, "mobile/assets/badges/gold.png"),
  walk: path.join(SHOTS, "295D7A3E-924B-40C7-9900-0A4613317A96.jpg"),
  captured: path.join(SHOTS, "D8BE4252-56A8-4B93-B944-9D82B404BB87.jpg"),
  league: path.join(SHOTS, "ED702DFD-F3B0-4517-8C60-E4FEB548C8EB.jpg"),
  egg: path.join(SHOTS, "C2EA70B0-0CD6-4D92-AAFE-8EC1C33A2133.jpg"),
  mochi: path.join(SHOTS, "0B82DD1F-6522-46CD-8774-F7C4336505D4.jpg"),
};

const SIZE = {
  walk: { w: 1206, h: 2335 },
  captured: { w: 1206, h: 2231 },
  league: { w: 1206, h: 1227 },
  egg: { w: 1206, h: 1069 },
  mochi: { w: 1206, h: 1499 },
};

function notes(text) {
  return text.trim();
}

function shadow() {
  return { type: "outer", color: HEX.navy, opacity: 0.1, blur: 8, offset: 2, angle: 90 };
}

function fit(size, maxW, maxH) {
  const ratio = size.w / size.h;
  let h = maxH;
  let w = h * ratio;
  if (w > maxW) {
    w = maxW;
    h = w / ratio;
  }
  return { w, h };
}

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";
pres.author = "Luis Mendez, Abdullah Rashid";
pres.title = "HuskiesPaws — BigRed//Hacks 2026";
pres.subject = "Navigation-themed demo deck";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

function card(slide, x, y, w, h, fill, name) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    rectRadius: 0.14,
    shadow: shadow(),
    objectName: name,
  });
}

function addShot(slide, key, x, y, maxW, maxH, { frame = false, name = key } = {}) {
  const box = fit(SIZE[key], maxW, maxH);
  if (frame) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x - 0.08,
      y: y - 0.08,
      w: box.w + 0.16,
      h: box.h + 0.16,
      fill: { color: HEX.navy },
      rectRadius: 0.18,
      objectName: `${name}-frame`,
    });
  }
  slide.addImage({
    path: FILE[key],
    x,
    y,
    w: box.w,
    h: box.h,
    objectName: name,
  });
  return box;
}

function callout(slide, x, y, w, h, text, name) {
  card(slide, x, y, w, h, HEX.white, name);
  slide.addText(text, {
    x: x + 0.14,
    y: y + 0.08,
    w: w - 0.28,
    h: h - 0.16,
    fontSize: 14,
    color: C.text1,
    margin: 0,
    valign: "middle",
    isTextBox: true,
  });
}

pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  objects: [
    {
      placeholder: {
        options: {
          name: "title",
          type: "title",
          x: 0.5,
          y: 0.22,
          w: 12.3,
          h: 0.62,
          fontSize: 30,
          bold: true,
          color: C.text1,
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
          x: 0.5,
          y: 7.16,
          w: 12.3,
          h: 0.2,
          fontSize: 11,
          color: C.accent6,
          margin: 0,
        },
      },
    },
  ],
});

pres.addSection({ title: "Pitch" });
pres.addSection({ title: "Demo" });
pres.addSection({ title: "Build" });
pres.addSection({ title: "Close" });

// 1 Title
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Pitch" });
  s.addText("HuskiesPaws", { placeholder: "title", isTextBox: true });
  s.addImage({ path: FILE.splash, x: 0.55, y: 1.15, w: 2.1, h: 2.1, objectName: "mascot" });
  s.addText("Turn everyday walks into a creature-collecting adventure.", {
    x: 2.9,
    y: 1.2,
    w: 9.8,
    h: 0.8,
    fontSize: 22,
    italic: true,
    color: C.accent5,
    margin: 0,
    isTextBox: true,
  });
  s.addText("BigRed//Hacks 2026  ·  Navigation  ·  the phone app", {
    x: 2.9,
    y: 2.05,
    w: 9.8,
    h: 0.4,
    fontSize: 16,
    color: C.accent6,
    margin: 0,
    isTextBox: true,
  });
  const chips = ["Luis Mendez", "Abdullah Rashid", "Built with Cursor"];
  chips.forEach((t, i) => {
    const x = 0.55 + i * 4.2;
    card(s, x, 3.55, 4.0, 1.05, C.background2, `chip-${i}`);
    s.addText(t, {
      x: x + 0.15,
      y: 3.7,
      w: 3.7,
      h: 0.75,
      align: "center",
      fontSize: 18,
      bold: true,
      color: C.text1,
      margin: 0,
      valign: "middle",
      isTextBox: true,
    });
  });
  s.addImage({ path: FILE.pip, x: 4.2, y: 4.9, w: 1.35, h: 1.35, objectName: "pip" });
  s.addImage({ path: FILE.fern, x: 6.0, y: 4.9, w: 1.35, h: 1.35, objectName: "fern" });
  s.addImage({ path: FILE.moss, x: 7.8, y: 4.9, w: 1.35, h: 1.35, objectName: "moss" });
  s.addNotes(
    notes(`
About 25 seconds. We are HuskiesPaws. Ordinary walks become a creature-collecting adventure. Team is Luis Mendez and Abdullah Rashid, BigRed Hacks 2026, Navigation. The product is the phone app. Invite them to watch the loop.
`)
  );
}

// 2 Problem
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Pitch" });
  s.addText("Maps get you there. They do not make you look.", {
    placeholder: "title",
    isTextBox: true,
  });
  const pts = [
    { t: "Shortest path", d: "Navigation ends at the pin." },
    { t: "Phone away", d: "The walk itself is leftover time." },
    { t: "Missed places", d: "Campus already has stories." },
  ];
  pts.forEach((p, i) => {
    const x = 0.55 + i * 4.2;
    card(s, x, 1.15, 4.0, 3.7, HEX.white, `p-${i}`);
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.55,
      y: 1.45,
      w: 0.85,
      h: 0.85,
      fill: { color: C.accent2 },
      objectName: `n-${i}`,
    });
    s.addText(String(i + 1), {
      x: x + 1.55,
      y: 1.55,
      w: 0.85,
      h: 0.65,
      align: "center",
      fontSize: 22,
      bold: true,
      color: C.text1,
      margin: 0,
      isTextBox: true,
    });
    s.addText(p.t, {
      x: x + 0.25,
      y: 2.5,
      w: 3.5,
      h: 0.7,
      align: "center",
      fontSize: 22,
      bold: true,
      color: C.text1,
      margin: 0,
      isTextBox: true,
    });
    s.addText(p.d, {
      x: x + 0.3,
      y: 3.25,
      w: 3.4,
      h: 1.2,
      align: "center",
      fontSize: 16,
      color: C.accent6,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addText("No fake statistics. Walking already happens. Discovery does not.", {
    x: 0.55,
    y: 5.15,
    w: 12.2,
    h: 0.7,
    fontSize: 20,
    italic: true,
    color: C.accent5,
    margin: 0,
    isTextBox: true,
  });
  s.addNotes(
    notes(`
About 25 seconds. Do not invent numbers. Typical maps optimize for arrival. People miss buildings and corners they walk past every day. Walking already happens; discovery and progress do not. That is the gap on campus.
`)
  );
}

// 3 Solution — real landmark screen
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Pitch" });
  s.addText("Explore  →  Walk  →  Discover  →  Collect", {
    placeholder: "title",
    isTextBox: true,
  });
  const steps = [
    { t: "Explore", d: "Pip scouts a real nearby place." },
    { t: "Walk", d: "Fern turns it into a route." },
    { t: "Discover", d: "Moss tells the grounded story." },
    { t: "Collect", d: "Capture it. Walking fills eggs." },
  ];
  steps.forEach((step, i) => {
    const y = 1.05 + i * 1.2;
    card(s, 0.5, y, 5.35, 1.08, HEX.white, `loop-${i}`);
    s.addShape(pres.shapes.OVAL, {
      x: 0.68,
      y: y + 0.22,
      w: 0.62,
      h: 0.62,
      fill: { color: C.accent1 },
      objectName: `loop-n-${i}`,
    });
    s.addText(String(i + 1), {
      x: 0.68,
      y: y + 0.28,
      w: 0.62,
      h: 0.5,
      align: "center",
      fontSize: 18,
      bold: true,
      color: HEX.white,
      margin: 0,
      isTextBox: true,
    });
    s.addText(step.t, {
      x: 1.5,
      y: y + 0.12,
      w: 4.1,
      h: 0.38,
      fontSize: 18,
      bold: true,
      color: C.text1,
      margin: 0,
      isTextBox: true,
    });
    s.addText(step.d, {
      x: 1.5,
      y: y + 0.5,
      w: 4.1,
      h: 0.42,
      fontSize: 14,
      color: C.accent6,
      margin: 0,
      isTextBox: true,
    });
  });
  const phone = addShot(s, "walk", 6.2, 1.0, 3.2, 5.55, { frame: true, name: "solution-phone" });
  const cx = 6.2 + phone.w + 0.18;
  callout(s, cx, 1.85, 3.5, 1.35, "Bailey Hall, a real campus place.", "sol-call-1");
  callout(s, cx, 3.4, 3.5, 1.45, "Pick a squad pet, then tap Walk there.", "sol-call-2");
  s.addNotes(
    notes(`
About 30 seconds. Loop: Explore, Walk, Discover, Collect. Pip scouts with Wikipedia and OpenStreetMap. Fern starts the walk. Moss tells the story from those facts. Capture and eggs reward the walk. Point at the screenshot: a real landmark, a squad pet, and Walk there. Then go to the live phone.
`)
  );
}

// 4 Live demo
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Demo" });
  s.addText("Keep this slide up. Hand them the phone.", {
    placeholder: "title",
    isTextBox: true,
  });
  card(s, 0.5, 0.95, 12.35, 0.58, HEX.navy, "demo-banner");
  s.addText("Demo Walk is ON  ·  steps at the table are simulated", {
    x: 0.65,
    y: 1.02,
    w: 12.05,
    h: 0.44,
    align: "center",
    fontSize: 18,
    bold: true,
    color: C.accent3,
    margin: 0,
    valign: "middle",
    isTextBox: true,
  });
  const league = addShot(s, "league", 0.5, 1.7, 5.7, 4.55, { frame: false, name: "demo-league" });
  const walk = addShot(s, "walk", 0.5 + league.w + 0.22, 1.7, 2.85, 4.55, { frame: true, name: "demo-walk" });
  const cx = 0.5 + league.w + 0.22 + walk.w + 0.22;
  const cw = 12.85 - cx;
  callout(s, cx, 1.7, cw, 1.4, "1–2  Pip explores. League-up. Practice walk.", "c1");
  callout(s, cx, 3.25, cw, 1.4, "3  Pick Bailey Hall. Start the 161 m walk.", "c2");
  callout(s, cx, 4.8, cw, 1.4, "4  Capture the landmark. Hide Expo tools.", "c3");
  s.addNotes(
    notes(`
Keep this slide visible. Hand the phone over if they want it. Demo Walk ON — say walks are simulated. Sequence: Squad, Pip, Explore. Pick the postcard. Start walk. Watch the blooming trail. Capture. If Grok is slow, keep going. Hide the Expo tools button. Do not claim a live server unless /api/health is up.
`)
  );
}

// 5 Architecture
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Build" });
  s.addText("A phone, a small API, the real world", {
    placeholder: "title",
    isTextBox: true,
  });
  const boxes = [
    { t: "Phone", d: "Expo app\nShared game logic" },
    { t: "API", d: "Node /api\nSecrets stay here", dark: true },
    { t: "World", d: "Wikipedia · OSM\nVoice and art optional" },
  ];
  boxes.forEach((b, i) => {
    const x = 0.55 + i * 4.25;
    card(s, x, 1.2, 3.7, 2.45, b.dark ? HEX.navy : HEX.white, `arch-${i}`);
    s.addText(b.t, {
      x: x + 0.22,
      y: 1.4,
      w: 3.25,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: b.dark ? C.accent3 : C.text1,
      margin: 0,
      isTextBox: true,
    });
    s.addText(b.d, {
      x: x + 0.22,
      y: 2.05,
      w: 3.25,
      h: 1.3,
      fontSize: 18,
      color: b.dark ? HEX.white : C.accent6,
      margin: 0,
      isTextBox: true,
    });
    if (i < 2) {
      s.addText("→", {
        x: x + 3.55,
        y: 2.1,
        w: 0.7,
        h: 0.55,
        align: "center",
        fontSize: 28,
        bold: true,
        color: C.accent1,
        margin: 0,
        isTextBox: true,
      });
    }
  });
  const facts = [
    "Facts and routes come from tools, not the model.",
    "Photon carries the same squad into iMessage.",
    "Designed and iterated in Cursor.",
  ];
  facts.forEach((line, i) => {
    const y = 4.0 + i * 0.85;
    s.addShape(pres.shapes.OVAL, {
      x: 0.65,
      y: y + 0.18,
      w: 0.32,
      h: 0.32,
      fill: { color: C.accent2 },
      objectName: `f-${i}`,
    });
    s.addText(line, {
      x: 1.15,
      y,
      w: 11.5,
      h: 0.7,
      fontSize: 20,
      color: C.text1,
      margin: 0,
      valign: "middle",
      isTextBox: true,
    });
  });
  s.addNotes(
    notes(`
About 25 seconds. Phone talks to our Node API. Secrets never ship in the app. Wikipedia and OSM ground the adventure. Speech and Imagine are optional. Shared core keeps pets, ranks, and walks consistent. Photon is iMessage. Built in Cursor. Do not say Render is live unless health is green.
`)
  );
}

// 6 Collectibles
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Build" });
  s.addText("Walking earns creatures and landmarks", {
    placeholder: "title",
    isTextBox: true,
  });
  const egg = addShot(s, "egg", 0.45, 1.05, 3.55, 3.2, { frame: false, name: "egg" });
  const mochi = addShot(s, "mochi", 4.15, 1.05, 3.35, 4.2, { frame: false, name: "mochi" });
  const captured = addShot(s, "captured", 7.7, 1.05, 2.55, 4.6, { frame: true, name: "captured" });
  callout(s, 0.45, 1.05 + egg.h + 0.12, 3.55, 1.15, "An egg fills as you walk. Demo walks on.", "egg-c");
  callout(s, 4.15, 1.05 + mochi.h + 0.12, 3.35, 1.15, "Meet Mochi — a rare Storyteller from a hatch.", "mochi-c");
  callout(s, 7.7, 1.05 + captured.h + 0.12, 5.1, 0.7, "Nova holds Bailey Hall.", "cap-c");
  s.addNotes(
    notes(`
About 25 seconds. Three things they saw: navigation is play; walking earns creatures; you can hold a real landmark. ISS rare-hatch boost is in shared logic. Be honest about Grok keys, deploy, and background GPS. The squad can also live in iMessage.
`)
  );
}

// 7 Close
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Close" });
  s.addText("Everyday walks. Extraordinary company.", {
    placeholder: "title",
    isTextBox: true,
  });
  s.addText("Campus, hometown blocks, the path between classes — same loop.", {
    x: 0.5,
    y: 1.0,
    w: 12.3,
    h: 0.4,
    fontSize: 18,
    color: C.accent5,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Planned next — not shipped", {
    x: 0.5,
    y: 1.55,
    w: 12.3,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: C.accent1,
    margin: 0,
    isTextBox: true,
  });
  const next = [
    { t: "Background tracking", d: "Honest walks with the phone in a pocket." },
    { t: "A deploy that stays awake", d: "Grok and turf up for a whole event." },
    { t: "Richer social exploration", d: "Shared landmarks without a grind." },
  ];
  next.forEach((n, i) => {
    const x = 0.5 + i * 4.2;
    card(s, x, 2.05, 4.0, 2.25, HEX.white, `next-${i}`);
    s.addText(n.t, {
      x: x + 0.22,
      y: 2.25,
      w: 3.55,
      h: 0.85,
      fontSize: 20,
      bold: true,
      color: C.text1,
      margin: 0,
      isTextBox: true,
    });
    s.addText(n.d, {
      x: x + 0.22,
      y: 3.15,
      w: 3.55,
      h: 0.85,
      fontSize: 16,
      color: C.accent6,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addImage({ path: FILE.splash, x: 0.55, y: 4.65, w: 1.25, h: 1.25, objectName: "close-mascot" });
  s.addText("Try it on the phone. Ask us anything.", {
    x: 2.05,
    y: 4.8,
    w: 10.6,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: C.text1,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Luis Mendez  ·  Abdullah Rashid", {
    x: 2.05,
    y: 5.35,
    w: 10.6,
    h: 0.4,
    fontSize: 16,
    color: C.accent6,
    margin: 0,
    isTextBox: true,
  });
  s.addNotes(
    notes(`
About 25 seconds. Close on campus exploration — not inflated stats. Next is planned: background tracking, a deploy that stays awake, richer social play. Line: Everyday walks. Extraordinary company. Hand them the phone.
`)
  );
}

await pres.writeFile({ fileName: OUT });
await applyTheme(OUT, THEME);
console.log("Wrote", OUT);
