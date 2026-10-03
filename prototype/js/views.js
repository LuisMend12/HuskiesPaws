// DOM rendering only. These are the pieces that get rewritten as mobile screens;
// the game logic they display lives in agents.js, rank.js and leaderboard.js.
import { creatureSvg } from "./art.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function agentCard(agent, { level, isAway, disabled, onAction }) {
  const li = el("li", `agent${isAway ? " away" : ""}`);
  li.innerHTML = creatureSvg(agent, level); // static, trusted markup

  const info = el("div");
  const progress = el("div", "agent-progress");
  const bar = el("div");
  bar.id = `progress-${agent.id}`;
  progress.append(bar);
  info.append(
    el("div", "agent-name", `${agent.name} · Lv ${level}`),
    el("div", "agent-role", isAway ? "On an expedition…" : agent.role),
    progress,
  );

  const button = el("button", "", agent.action);
  button.disabled = disabled;
  button.addEventListener("click", onAction);

  li.append(info, button);
  return li;
}

export function renderRankBadge(node, { current }, score) {
  node.textContent = `${current.emoji} ${current.name} · ${score} pts`;
}

export function renderRankCard(node, { current, next, progress }, score, stats) {
  const title = el("div", "rank-title", `${current.emoji} ${current.name}`);
  const meter = el("div", "rank-meter");
  const fill = el("div");
  fill.style.width = `${Math.round(progress * 100)}%`;
  meter.append(fill);
  const nextText = next
    ? `${next.min - score} pts to ${next.emoji} ${next.name}`
    : "Top rank reached!";
  const breakdown = el(
    "div",
    "rank-breakdown",
    `${stats.steps.toLocaleString()} steps · ${stats.landmarksFound} found · ${stats.landmarksCaptured} captured`,
  );
  node.replaceChildren(title, meter, el("div", "rank-next", `${score} pts · ${nextText}`), breakdown);
}

export function renderLeaderboard(node, rows) {
  node.replaceChildren(
    ...rows.map((row) => {
      const li = el("li", row.isYou ? "you" : "");
      li.append(
        el("span", "lb-pos", `#${row.position}`),
        el("span", "lb-name", row.isYou ? "You" : row.name),
        el("span", "lb-score", row.score.toLocaleString()),
      );
      return li;
    }),
  );
}

export function renderAlbum(node, emptyNode, cards) {
  emptyNode.hidden = cards.length > 0;
  node.replaceChildren(
    ...cards.map((card) => {
      const figure = el("figure", "album-card");
      const img = el("img");
      img.src = card.image;
      img.alt = `Postcard of ${card.title}`;
      figure.append(img, el("figcaption", "", card.title));
      return figure;
    }),
  );
}
