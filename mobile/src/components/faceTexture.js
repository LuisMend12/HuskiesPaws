// The 3D pets' face as one flat decal (Roblox simulator-pet style): two big
// close-set eyes, a small nose and mouth, and blush, painted into a small
// transparent texture in code (no image files). One textured plane replaces a
// dozen face meshes, which matters on Expo where every draw costs JS time.
// Ears, body, feet and accessories stay 3D (Pet3D.js).
import { DataTexture, LinearFilter, RGBAFormat, SRGBColorSpace } from "three";

const SIZE = 256;
// The decal covers this part of the body's front, in the pet's units.
export const FACE_PLANE = Object.freeze({ width: 1.2, height: 0.96, y: -0.04 });

const hex = (color) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));

// Paints an ellipse (pet units, origin = plane centre, y up) with soft edges.
// keep(dx, dy) can cut it (for the mouth's lower half).
function ellipse(pixels, cx, cy, rx, ry, color, keep = null) {
  const [r, g, b] = hex(color);
  const px = (x) => ((x / FACE_PLANE.width) + 0.5) * SIZE;
  const py = (y) => (y / FACE_PLANE.height + 0.5) * SIZE; // row 0 = bottom of the texture
  const x0 = Math.max(0, Math.floor(px(cx - rx)) - 1);
  const x1 = Math.min(SIZE - 1, Math.ceil(px(cx + rx)) + 1);
  const y0 = Math.max(0, Math.floor(py(cy - ry)) - 1);
  const y1 = Math.min(SIZE - 1, Math.ceil(py(cy + ry)) + 1);
  const rxPx = (rx / FACE_PLANE.width) * SIZE;
  const ryPx = (ry / FACE_PLANE.height) * SIZE;
  const edge = 1.2 / Math.min(rxPx, ryPx); // about one pixel of soft edge
  for (let row = y0; row <= y1; row += 1) {
    for (let col = x0; col <= x1; col += 1) {
      const dx = (col + 0.5 - px(cx)) / rxPx;
      const dy = (row + 0.5 - py(cy)) / ryPx;
      if (keep && !keep(dx, dy)) continue;
      const a = Math.min(1, Math.max(0, (1 - Math.hypot(dx, dy)) / edge + 0.5));
      if (a <= 0) continue;
      const i = (row * SIZE + col) * 4;
      const under = pixels[i + 3] / 255;
      pixels[i] = r * a + pixels[i] * (1 - a);
      pixels[i + 1] = g * a + pixels[i + 1] * (1 - a);
      pixels[i + 2] = b * a + pixels[i + 2] * (1 - a);
      pixels[i + 3] = 255 * (a + under * (1 - a));
    }
  }
}

// A curved stroke: the band between two ellipses, lower half only (a smile).
function smile(pixels, cx, cy, r, thickness, color) {
  ellipse(pixels, cx, cy, r + thickness, r + thickness, color, (dx, dy) => dy < 0 && Math.hypot(dx, dy) > r / (r + thickness));
}

function eye(pixels, x, y, iris) {
  ellipse(pixels, x, y, 0.235, 0.26, "#16233b"); // outline
  ellipse(pixels, x, y, 0.205, 0.23, "#ffffff");
  ellipse(pixels, x + 0.01, y - 0.02, 0.145, 0.165, iris);
  ellipse(pixels, x + 0.015, y - 0.03, 0.075, 0.085, "#0b1f3a");
  ellipse(pixels, x - 0.05, y + 0.06, 0.05, 0.055, "#ffffff"); // shine
}

const cache = new Map();

// One texture per eye colour, shared by every pet that uses it.
export function faceTexture({ iris = "#4fb3ff" } = {}) {
  if (cache.has(iris)) return cache.get(iris);
  const pixels = new Uint8Array(SIZE * SIZE * 4); // transparent: the fur shows through
  eye(pixels, -0.21, 0.14, iris);
  eye(pixels, 0.21, 0.14, iris);
  ellipse(pixels, -0.43, -0.16, 0.08, 0.05, "#f48fb1"); // blush
  ellipse(pixels, 0.43, -0.16, 0.08, 0.05, "#f48fb1");
  ellipse(pixels, 0, -0.17, 0.065, 0.045, "#16233b"); // nose
  smile(pixels, -0.045, -0.2, 0.045, 0.02, "#16233b");
  smile(pixels, 0.045, -0.2, 0.045, 0.02, "#16233b");
  const texture = new DataTexture(pixels, SIZE, SIZE, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  cache.set(iris, texture);
  return texture;
}
