// Landmark capture, Pokemon Go style. The web version shows a live camera
// viewfinder with your agent overlaid, then turns the shot into a postcard.
// In the mobile app, replace the viewfinder with ARKit/ARCore (e.g. ViroReact)
// so the agent is anchored in 3D next to the landmark.
import { creatureSvg } from "./art.js";

const CARD = Object.freeze({ width: 480, height: 600, border: 16, photo: 448, creature: 110 });

export async function startCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) return null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    return stream;
  } catch (error) {
    console.warn("Camera unavailable:", error);
    return null;
  }
}

export function stopCamera(stream, video) {
  stream?.getTracks().forEach((track) => track.stop());
  if (video) video.srcObject = null;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src.slice(0, 80)}`));
    img.src = src;
  });
}

// Draw an image or video frame scaled to fill the box, cropping the overflow.
function drawCover(ctx, source, width, height, x, y, size) {
  const scale = Math.max(size / width, size / height);
  const w = width * scale;
  const h = height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();
  ctx.drawImage(source, x + (size - w) / 2, y + (size - h) / 2, w, h);
  ctx.restore();
}

function drawFallbackScene(ctx, x, y, size) {
  const sky = ctx.createLinearGradient(0, y, 0, y + size);
  sky.addColorStop(0, "#bde0fe");
  sky.addColorStop(1, "#95d5b2");
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, size, size);
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

async function drawPhoto(ctx, source) {
  const { border, photo } = CARD;
  if (source instanceof HTMLVideoElement && source.videoWidth) {
    drawCover(ctx, source, source.videoWidth, source.videoHeight, border, border, photo);
    return;
  }
  if (typeof source === "string") {
    const img = await loadImage(source);
    drawCover(ctx, img, img.naturalWidth, img.naturalHeight, border, border, photo);
    return;
  }
  drawFallbackScene(ctx, border, border, photo);
}

async function renderCard(source, place, agent, level, date) {
  const { width, height, border, photo, creature } = CARD;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fffdf6";
  ctx.fillRect(0, 0, width, height);
  await drawPhoto(ctx, source);

  const svg = creatureSvg(agent, level);
  const creatureImg = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  ctx.drawImage(creatureImg, border + 8, border + photo - creature - 4, creature, creature);

  ctx.fillStyle = "#2c3a2a";
  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.fillText(fitText(ctx, place.title, width - 2 * border), border, border + photo + 44);
  ctx.fillStyle = "#6b7a66";
  ctx.font = "16px system-ui, sans-serif";
  const caption = `Captured with ${agent.name} · ${date.toLocaleDateString()}`;
  ctx.fillText(caption, border, border + photo + 76);
  ctx.fillText("🌸 Wanderlings", width - border - 130, border + photo + 76);

  return canvas.toDataURL("image/jpeg", 0.8);
}

// Returns a JPEG data URL. If the photo can't be used (e.g. a cross-origin image
// taints the canvas), falls back to an illustrated background.
export async function composePostcard({ source, place, agent, level, date }) {
  try {
    return await renderCard(source, place, agent, level, date);
  } catch (error) {
    console.warn("Photo unusable for postcard, using illustration:", error);
    return renderCard(null, place, agent, level, date);
  }
}
