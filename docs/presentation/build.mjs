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

const IMG = {
  splash: path.join(ROOT, "mobile/assets/splash-icon.png"),
  icon: path.join(ROOT, "mobile/assets/icon.png"),
  gold: path.join(ROOT, "mobile/assets/badges/gold.png"),
  pip: path.join(ART, "scout.png"),
  moss: path.join(ART, "storyteller.png"),
  fern: path.join(ART, "pathfinder.png"),
  postcard: path.join(ART, "postcard.png"),
};

function notes(text) {
  return text.trim();
}

function shadow() {
  return { type: "outer", color: HEX.navy, opacity: 0.08, blur: 8, offset: 2, angle: 90 };
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
    rectRadius: 0.16,
    shadow: shadow(),
    objectName: name,
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
          x: 0.6,
          y: 0.28,
          w: 12.1,
          h: 0.72,
          fontSize: 36,
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
          x: 0.6,
          y: 7.16,
          w: 12.1,
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

// ── 1 Title ────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Pitch" });
  s.addText("HuskiesPaws", { placeholder: "title", isTextBox: true });
  s.addImage({ path: IMG.splash, x: 0.7, y: 1.2, w: 2.2, h: 2.2, objectName: "mascot" });
  s.addText("Turn everyday walks into a creature-collecting adventure.", {
    x: 3.15,
    y: 1.25,
    w: 9.4,
    h: 0.85,
    fontSize: 24,
    italic: true,
    color: C.accent5,
    margin: 0,
    isTextBox: true,
    objectName: "tagline",
  });
  s.addText("BigRed//Hacks 2026  ·  Navigation  ·  the phone app", {
    x: 3.15,
    y: 2.15,
    w: 9.4,
    h: 0.4,
    fontSize: 18,
    color: C.accent6,
    margin: 0,
    isTextBox: true,
    objectName: "event",
  });

  const chips = [
    { t: "Luis Mendez", x: 0.7 },
    { t: "Abdullah Rashid", x: 4.9 },
    { t: "Built with Cursor", x: 9.1 },
  ];
  chips.forEach((chip) => {
    card(s, chip.x, 3.55, 3.95, 1.2, C.background2, `chip-${chip.t}`);
    s.addText(chip.t, {
      x: chip.x + 0.2,
      y: 3.75,
      w: 3.55,
      h: 0.8,
      fontSize: 20,
      bold: true,
      color: C.text1,
      margin: 0,
      valign: "middle",
      align: "center",
      isTextBox: true,
    });
  });
  s.addImage({ path: IMG.pip, x: 4.15, y: 5.05, w: 1.45, h: 1.45, objectName: "pip" });
  s.addImage({ path: IMG.fern, x: 5.95, y: 5.05, w: 1.45, h: 1.45, objectName: "fern" });
  s.addImage({ path: IMG.moss, x: 7.75, y: 5.05, w: 1.45, h: 1.45, objectName: "moss" });
  s.addNotes(
    notes(`
About 25 seconds. We are HuskiesPaws. Ordinary walks become a creature-collecting adventure. Team is Luis Mendez and Abdullah Rashid, BigRed Hacks 2026, Navigation. The product is the phone app. Invite them to watch the loop.
`)
  );
}

// ── 2 Problem ──────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Pitch" });
  s.addText("Maps get you there. They do not make you look.", {
    placeholder: "title",
    isTextBox: true,
  });
  const pts = [
    { t: "Shortest path", d: "Navigation ends at the pin." },
    { t: "Phone away", d: "The walk itself is leftover time." },
    { t: "Missed places", d: "Campus already has stories. Nothing asks you to notice." },
  ];
  pts.forEach((p, i) => {
    const x = 0.6 + i * 4.15;
    card(s, x, 1.25, 3.95, 3.55, HEX.white, `problem-${i}`);
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.5,
      y: 1.5,
      w: 0.9,
      h: 0.9,
      fill: { color: C.accent2 },
      objectName: `dot-${i}`,
    });
    s.addText(String(i + 1), {
      x: x + 1.5,
      y: 1.62,
      w: 0.9,
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
      y: 2.6,
      w: 3.45,
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
      y: 3.35,
      w: 3.35,
      h: 1.1,
      align: "center",
      fontSize: 16,
      color: C.accent6,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addText("No fake statistics. Walking already happens. Discovery does not.", {
    x: 0.6,
    y: 5.05,
    w: 12.1,
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

// ── 3 Solution loop ────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Pitch" });
  s.addText("Explore  →  Walk  →  Discover  →  Collect", {
    placeholder: "title",
    isTextBox: true,
  });
  const steps = [
    { img: IMG.pip, t: "Explore", who: "Pip", d: "Scouts a nearby place with Wikipedia and OSM." },
    { img: IMG.fern, t: "Walk", who: "Fern", d: "Guides the route. The trail blooms." },
    { img: IMG.moss, t: "Discover", who: "Moss", d: "Tells the grounded story." },
    { img: IMG.gold, t: "Collect", who: "You", d: "Capture the landmark. Eggs fill as you walk." },
  ];
  steps.forEach((step, i) => {
    const x = 0.55 + i * 3.2;
    card(s, x, 1.15, 3.05, 4.35, HEX.white, `loop-${step.t}`);
    s.addImage({ path: step.img, x: x + 0.55, y: 1.35, w: 1.95, h: 1.95, objectName: `art-${step.t}` });
    s.addText(step.t, {
      x: x + 0.15,
      y: 3.4,
      w: 2.75,
      h: 0.45,
      align: "center",
      fontSize: 22,
      bold: true,
      color: C.text1,
      margin: 0,
      isTextBox: true,
    });
    s.addText(step.who, {
      x: x + 0.15,
      y: 3.85,
      w: 2.75,
      h: 0.32,
      align: "center",
      fontSize: 14,
      color: C.accent1,
      margin: 0,
      isTextBox: true,
    });
    s.addText(step.d, {
      x: x + 0.18,
      y: 4.22,
      w: 2.7,
      h: 1.1,
      align: "center",
      fontSize: 14,
      color: C.accent6,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addText("Pip, Fern, and Moss — original art from the app.", {
    x: 0.6,
    y: 5.65,
    w: 12.1,
    h: 1.2,
    fontSize: 16,
    color: C.accent6,
    margin: 0,
    isTextBox: true,
  });
  s.addNotes(
    notes(`
About 30 seconds. Loop: Explore, Walk, Discover, Collect. Pip scouts with Wikipedia and OpenStreetMap. Fern starts the walk. Moss tells the story from those facts. Capture and eggs reward the walk. Then go to the live phone.
`)
  );
}

// ── 4 Demo ─────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Demo" });
  s.addText("Keep this slide up. Hand them the phone.", {
    placeholder: "title",
    isTextBox: true,
  });
  card(s, 0.6, 1.15, 12.15, 0.75, C.text2, "demo-banner");
  s.addText("Demo Walk is ON  ·  steps are simulated at the table", {
    x: 0.8,
    y: 1.25,
    w: 11.75,
    h: 0.55,
    align: "center",
    fontSize: 20,
    bold: true,
    color: C.accent3,
    margin: 0,
    valign: "middle",
    isTextBox: true,
  });
  const seq = [
    { n: "1", t: "Pip explores" },
    { n: "2", t: "Choose a place" },
    { n: "3", t: "Start a walk" },
    { n: "4", t: "Capture" },
  ];
  seq.forEach((step, i) => {
    const x = 0.6 + i * 3.2;
    card(s, x, 2.15, 3.05, 2.55, HEX.white, `demo-${step.n}`);
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.1,
      y: 2.4,
      w: 0.8,
      h: 0.8,
      fill: { color: C.accent1 },
      objectName: `n-${step.n}`,
    });
    s.addText(step.n, {
      x: x + 1.1,
      y: 2.5,
      w: 0.8,
      h: 0.6,
      align: "center",
      fontSize: 24,
      bold: true,
      color: HEX.white,
      margin: 0,
      isTextBox: true,
    });
    s.addText(step.t, {
      x: x + 0.15,
      y: 3.4,
      w: 2.75,
      h: 0.95,
      align: "center",
      fontSize: 22,
      bold: true,
      color: C.text1,
      margin: 0,
      isTextBox: true,
    });
  });
  card(s, 0.6, 4.95, 12.15, 1.85, HEX.iceSoft, "missing-shots");
  s.addText("Follow these four taps on the phone.", {
    x: 0.85,
    y: 5.15,
    w: 11.65,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: C.text1,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Hide the Expo tools button. If voice is slow, keep going.", {
    x: 0.85,
    y: 5.7,
    w: 11.65,
    h: 0.8,
    fontSize: 16,
    color: C.accent6,
    margin: 0,
    isTextBox: true,
  });
  s.addNotes(
    notes(`
Keep this slide visible. Hand the phone over if they want it. Demo Walk ON — say walks are simulated. Sequence: Squad, Pip, Explore. Pick the postcard. Start walk. Watch the blooming trail. Capture. If Grok is slow, keep going. Hide the Expo tools button. Do not claim a live server unless /api/health is up.
`)
  );
}

// ── 5 Architecture ─────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Build" });
  s.addText("A phone, a small API, the real world", {
    placeholder: "title",
    isTextBox: true,
  });
  const boxes = [
    { t: "Phone", d: "Expo app\nShared game logic", fill: HEX.white, ink: C.text1 },
    { t: "API", d: "Node /api\nSecrets stay here", fill: C.text2, ink: HEX.white },
    { t: "World", d: "Wikipedia · OSM\nVoice and art optional", fill: HEX.white, ink: C.text1 },
  ];
  boxes.forEach((b, i) => {
    const x = 0.7 + i * 4.2;
    card(s, x, 1.5, 3.55, 2.7, b.fill, `arch-${b.t}`);
    s.addText(b.t, {
      x: x + 0.2,
      y: 1.75,
      w: 3.15,
      h: 0.6,
      fontSize: 26,
      bold: true,
      color: i === 1 ? C.accent3 : C.text1,
      margin: 0,
      isTextBox: true,
    });
    s.addText(b.d, {
      x: x + 0.2,
      y: 2.5,
      w: 3.15,
      h: 1.35,
      fontSize: 18,
      color: i === 1 ? HEX.white : C.accent6,
      margin: 0,
      isTextBox: true,
    });
    if (i < 2) {
      s.addText("→", {
        x: x + 3.5,
        y: 2.4,
        w: 0.75,
        h: 0.7,
        align: "center",
        fontSize: 32,
        bold: true,
        color: C.accent1,
        margin: 0,
        isTextBox: true,
        objectName: `arrow-${i}`,
      });
    }
  });
  const facts = [
    "Facts and routes come from tools, not the model.",
    "Photon carries the same squad into iMessage.",
    "Designed and iterated in Cursor.",
  ];
  facts.forEach((line, i) => {
    const y = 4.55 + i * 0.7;
    s.addShape(pres.shapes.OVAL, {
      x: 0.75,
      y: y + 0.12,
      w: 0.28,
      h: 0.28,
      fill: { color: C.accent2 },
      objectName: `fact-dot-${i}`,
    });
    s.addText(line, {
      x: 1.2,
      y,
      w: 11.4,
      h: 0.55,
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

// ── 6 Special ──────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Build" });
  s.addText("Walking becomes play", {
    placeholder: "title",
    isTextBox: true,
  });
  const items = [
    { img: IMG.splash, t: "The map is a trail", d: "A blooming path and a squad, not only a blue line." },
    { img: IMG.gold, t: "Steps earn creatures", d: "Eggs, ranks, and captures — completable in Demo Walk." },
    { img: IMG.pip, t: "It continues in iMessage", d: "Same squad over Photon. Terminal today; iMessage with keys." },
  ];
  items.forEach((it, i) => {
    const x = 0.55 + i * 4.2;
    card(s, x, 1.2, 4.0, 4.15, HEX.white, `special-${i}`);
    s.addImage({ path: it.img, x: x + 1.2, y: 1.4, w: 1.55, h: 1.55, objectName: `special-art-${i}` });
    s.addText(it.t, {
      x: x + 0.22,
      y: 3.1,
      w: 3.55,
      h: 0.7,
      fontSize: 20,
      bold: true,
      color: C.text1,
      margin: 0,
      isTextBox: true,
    });
    s.addText(it.d, {
      x: x + 0.22,
      y: 3.85,
      w: 3.55,
      h: 1.2,
      fontSize: 16,
      color: C.accent6,
      margin: 0,
      isTextBox: true,
    });
  });
  card(s, 0.55, 5.55, 6.05, 1.3, C.background2, "working");
  s.addText("Working  ·  ISS overhead can boost rare hatches.", {
    x: 0.75,
    y: 5.75,
    w: 5.65,
    h: 0.9,
    fontSize: 16,
    color: C.text1,
    margin: 0,
    valign: "middle",
    isTextBox: true,
  });
  card(s, 6.8, 5.55, 5.95, 1.3, HEX.iceSoft, "later");
  s.addText("Later  ·  live Grok without a key, cloud deploy, background tracking.", {
    x: 7.0,
    y: 5.75,
    w: 5.55,
    h: 0.9,
    fontSize: 16,
    color: C.accent6,
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

// ── 7 Close ────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Close" });
  s.addText("Everyday walks. Extraordinary company.", {
    placeholder: "title",
    isTextBox: true,
  });
  s.addText("Campus, hometown blocks, the path between classes — same loop.", {
    x: 0.6,
    y: 1.1,
    w: 12.1,
    h: 0.45,
    fontSize: 18,
    color: C.accent5,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Planned next — not shipped", {
    x: 0.6,
    y: 1.7,
    w: 12.1,
    h: 0.4,
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
    const x = 0.6 + i * 4.15;
    card(s, x, 2.25, 3.95, 2.35, HEX.white, `next-${i}`);
    s.addText(n.t, {
      x: x + 0.22,
      y: 2.5,
      w: 3.5,
      h: 0.85,
      fontSize: 20,
      bold: true,
      color: C.text1,
      margin: 0,
      isTextBox: true,
    });
    s.addText(n.d, {
      x: x + 0.22,
      y: 3.4,
      w: 3.5,
      h: 0.9,
      fontSize: 16,
      color: C.accent6,
      margin: 0,
      isTextBox: true,
    });
  });
  s.addImage({ path: IMG.splash, x: 0.7, y: 4.9, w: 1.35, h: 1.35, objectName: "close-mascot" });
  s.addText("Try it on the phone. Ask us anything.", {
    x: 2.2,
    y: 5.15,
    w: 10.4,
    h: 0.55,
    fontSize: 24,
    bold: true,
    color: C.text1,
    margin: 0,
    isTextBox: true,
  });
  s.addText("Luis Mendez  ·  Abdullah Rashid", {
    x: 2.2,
    y: 5.75,
    w: 10.4,
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
