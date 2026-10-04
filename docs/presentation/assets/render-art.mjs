import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { AGENTS } from "../../../core/agents.js";
import { creatureSvg, postcardSvg } from "../../../core/art.js";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const outDir = path.dirname(fileURLToPath(import.meta.url));

async function pngFromSvg(svg, file, w, h = w) {
  const buf = await sharp(Buffer.from(svg))
    .resize(w, h, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  writeFileSync(file, buf);
}

const postcard = postcardSvg("A nearby landmark", AGENTS[0]).replace(
  "<svg ",
  '<svg xmlns="http://www.w3.org/2000/svg" '
);

await pngFromSvg(postcard, path.join(outDir, "postcard.png"), 800, 360);

for (const agent of AGENTS) {
  await pngFromSvg(
    creatureSvg(agent, 2),
    path.join(outDir, `${agent.id}.png`),
    512
  );
}

console.log("Wrote pet artwork into", outDir);
