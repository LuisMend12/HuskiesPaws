import assert from "node:assert/strict";
import { test } from "node:test";
import { followNext, nextStep, remainingWalkMeters, walkHud } from "../src/components/nextCoach.js";

const base = {
  progress: { landmarksFound: 0, walked: 0 },
  eggs: [],
  demoMode: true,
};

test("first visit points at Squad explore", () => {
  const step = nextStep(base);
  assert.equal(step.intent, "squad");
  assert.equal(step.cta, "Open Squad");
});

test("a ready egg is the next tap", () => {
  const step = nextStep({
    ...base,
    progress: { landmarksFound: 1, walked: 500 },
    eggs: [{ id: "e1", startWalked: 0, hatchMeters: 100 }],
  });
  assert.equal(step.intent, "hatch");
});

test("standing at a landmark beats a ready egg", () => {
  const step = nextStep({
    ...base,
    progress: { landmarksFound: 1, walked: 500 },
    capturable: { title: "Bailey Hall" },
    eggs: [{ id: "e1", startWalked: 0, hatchMeters: 100 }],
  });
  assert.equal(step.intent, "capture");
  assert.match(step.body, /Bailey Hall/);
});

test("followNext opens capture and hatches", () => {
  const calls = [];
  const game = {
    set: (patch) => calls.push(["set", patch]),
    hatchEgg: () => calls.push(["hatch"]),
  };
  followNext({ ...base, capturable: { title: "Library" } }, game);
  assert.deepEqual(calls, [["set", { captureOpen: true }]]);
  calls.length = 0;
  followNext({
    ...base,
    progress: { landmarksFound: 1, walked: 500 },
    eggs: [{ id: "e1", startWalked: 0, hatchMeters: 100 }],
  }, game);
  assert.deepEqual(calls, [["set", { tab: "pets" }], ["hatch"]]);
});

test("remaining walk meters follow the leftover route", () => {
  const meters = remainingWalkMeters({
    position: { lat: 0, lon: 0 },
    route: [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0.001 },
    ],
  });
  assert.ok(meters > 90 && meters < 130);
  assert.match(
    walkHud({ walking: true, position: { lat: 0, lon: 0 }, route: [{ lat: 0, lon: 0 }, { lat: 0, lon: 0.001 }], discovery: { place: { title: "Bailey Hall" } } }),
    /Bailey Hall/,
  );
});
