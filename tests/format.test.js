import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatMagnitude,
  magnitudeColor,
  magnitudeRadius,
  formatTimeAgo,
  filterByMinMagnitude,
  sortByTimeDesc,
  sortByMagnitudeDesc,
} from "../js/format.js";

test("formatMagnitude redondea a un decimal", () => {
  assert.equal(formatMagnitude(5.234), "M 5.2");
  assert.equal(formatMagnitude(3), "M 3.0");
});

test("formatMagnitude maneja valores nulos", () => {
  assert.equal(formatMagnitude(null), "M ?");
  assert.equal(formatMagnitude(undefined), "M ?");
});

test("magnitudeColor sigue los umbrales esperados", () => {
  assert.equal(magnitudeColor(2), "#4caf50");
  assert.equal(magnitudeColor(4), "#ffeb3b");
  assert.equal(magnitudeColor(5), "#ff9800");
  assert.equal(magnitudeColor(7), "#f44336");
});

test("magnitudeRadius crece con la magnitud y tiene un minimo", () => {
  assert.equal(magnitudeRadius(-1), 4);
  assert.ok(magnitudeRadius(7) > magnitudeRadius(3));
});

test("formatTimeAgo: segundos, minutos, horas y dias", () => {
  const now = new Date("2026-08-31T12:00:00Z").getTime();
  assert.equal(formatTimeAgo(now - 10_000, now), "hace unos segundos");
  assert.equal(formatTimeAgo(now - 5 * 60_000, now), "hace 5 minutos");
  assert.equal(formatTimeAgo(now - 60_000, now), "hace 1 minuto");
  assert.equal(formatTimeAgo(now - 3 * 3_600_000, now), "hace 3 horas");
  assert.equal(formatTimeAgo(now - 2 * 86_400_000, now), "hace 2 dias");
});

test("filterByMinMagnitude descarta sismos por debajo del umbral", () => {
  const features = [{ properties: { mag: 2.1 } }, { properties: { mag: 4.5 } }, { properties: { mag: 6.1 } }];
  const filtered = filterByMinMagnitude(features, 4);
  assert.equal(filtered.length, 2);
});

test("sortByTimeDesc ordena del mas reciente al mas viejo", () => {
  const features = [{ properties: { time: 100 } }, { properties: { time: 300 } }, { properties: { time: 200 } }];
  const sorted = sortByTimeDesc(features);
  assert.deepEqual(
    sorted.map((f) => f.properties.time),
    [300, 200, 100]
  );
});

test("sortByMagnitudeDesc ordena del mas fuerte al mas debil", () => {
  const features = [{ properties: { mag: 3 } }, { properties: { mag: 6 } }, { properties: { mag: 4.5 } }];
  const sorted = sortByMagnitudeDesc(features);
  assert.deepEqual(
    sorted.map((f) => f.properties.mag),
    [6, 4.5, 3]
  );
});
