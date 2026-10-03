// Grok Imagine postcard illustrations. The SVG postcard shows instantly; when
// Grok finishes drawing, the illustration replaces it (if the card is still open).
import { fetchImage, grokAvailable } from "./api.js";
import { firstSentences } from "./agents.js";

export async function illustratePostcard(container, discovery, isStillShown) {
  if (!grokAvailable()) return;
  try {
    const image = await fetchImage({
      kind: "postcard",
      placeId: String(discovery.place.id),
      title: discovery.place.title,
      fact: firstSentences(discovery.summary.extract ?? "", 1).slice(0, 300),
    });
    if (!isStillShown()) return;
    const img = document.createElement("img");
    img.src = image;
    img.alt = `Illustration of ${discovery.place.title} by Grok Imagine`;
    img.className = "postcard-illustration";
    const badge = document.createElement("span");
    badge.className = "grok-badge";
    badge.textContent = "Illustrated by Grok Imagine";
    container.replaceChildren(img, badge);
  } catch (error) {
    console.warn("Grok Imagine postcard unavailable:", error);
  }
}
