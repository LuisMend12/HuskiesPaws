import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDayPlace, addDaySteps, dayFingerprint, emptyDay, formatDayUpdate, mergeDayLogs,
  rollDay, shouldNotifyDay, todayKey,
} from "../dayLog.js";

const noon = new Date("2026-10-03T12:00:00");

test("a new calendar day starts empty", () => {
  const yesterday = { date: "2026-10-02", steps: 900, places: [{ id: "1", title: "Old" }] };
  assert.deepEqual(rollDay(yesterday, noon), emptyDay("2026-10-03"));
  assert.equal(todayKey(noon), "2026-10-03");
});

test("places you already passed are not duplicated", () => {
  let day = emptyDay("2026-10-03");
  day = addDayPlace(day, { id: 42, title: "Klarman Hall" }, noon);
  day = addDayPlace(day, { id: "42", title: "Klarman Hall" }, noon);
  assert.equal(day.places.length, 1);
  day = addDaySteps(day, 400.9, noon);
  assert.equal(day.steps, 400);
  day = addDaySteps(day, -3, noon);
  assert.equal(day.steps, 400);
});

test("merge keeps the higher step count and unions places", () => {
  const phone = { date: "2026-10-03", steps: 2100, places: [{ id: "a", title: "Uris" }] };
  const chat = { date: "2026-10-03", steps: 400, places: [{ id: "b", title: "Bailey" }] };
  const merged = mergeDayLogs(chat, phone, noon);
  assert.equal(merged.steps, 2100);
  assert.deepEqual(merged.places.map((p) => p.title).sort(), ["Bailey", "Uris"]);
});

test("Pip's update names places and steps, and notify fires on new places or milestones", () => {
  const before = { date: "2026-10-03", steps: 900, places: [] };
  const after = addDayPlace(addDaySteps(before, 200, noon), { id: "1", title: "Sage Chapel" }, noon);
  assert.equal(shouldNotifyDay(before, after), true);
  assert.match(formatDayUpdate(after, noon), /1,100 steps/);
  assert.match(formatDayUpdate(after, noon), /Sage Chapel/);
  assert.notEqual(dayFingerprint(before), dayFingerprint(after));
  assert.equal(shouldNotifyDay(after, { ...after, steps: 1101 }), false, "small step bumps are quiet");
  assert.equal(shouldNotifyDay(after, { ...after, steps: 2500 }), true);
});
