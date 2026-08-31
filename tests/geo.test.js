import { test } from "node:test";
import assert from "node:assert/strict";
import { distanceKm, isWithinZone, findNewQuakesInZone } from "../js/geo.js";

test("distanceKm entre el mismo punto es 0", () => {
  assert.equal(distanceKm(19.43, -99.13, 19.43, -99.13), 0);
});

test("distanceKm CDMX-Guadalajara es aproximadamente correcta (~460 km reales)", () => {
  const d = distanceKm(19.4326, -99.1332, 20.6597, -103.3496);
  assert.ok(d > 440 && d < 480, `se esperaba ~460km, se obtuvo ${d}`);
});

test("isWithinZone: dentro y fuera del radio", () => {
  const zone = { lat: 19.4326, lon: -99.1332, radiusKm: 100 };
  assert.equal(isWithinZone(19.5, -99.2, zone), true); // muy cerca
  assert.equal(isWithinZone(20.6597, -103.3496, zone), false); // Guadalajara, muy lejos
});

test("findNewQuakesInZone filtra por zona y por ids ya vistos", () => {
  const zone = { lat: 19.4326, lon: -99.1332, radiusKm: 100 };
  const features = [
    { id: "a", geometry: { coordinates: [-99.2, 19.5, 10] } }, // dentro, nuevo
    { id: "b", geometry: { coordinates: [-99.2, 19.5, 10] } }, // dentro, pero ya visto
    { id: "c", geometry: { coordinates: [-103.35, 20.66, 10] } }, // fuera de zona
  ];
  const seenIds = new Set(["b"]);
  const result = findNewQuakesInZone(features, zone, seenIds);
  assert.deepEqual(
    result.map((f) => f.id),
    ["a"]
  );
});
