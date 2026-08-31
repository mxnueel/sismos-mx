import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchFeed, queryRegion, MEXICO_BBOX } from "../js/usgs.js";

test("fetchFeed('day') trae sismos reales de las ultimas 24 horas (API real de USGS)", async () => {
  const features = await fetchFeed("day");
  assert.ok(Array.isArray(features));
  assert.ok(features.length > 0, "se esperaban sismos reales en las ultimas 24 horas a nivel global");
  const first = features[0];
  assert.ok(typeof first.properties.mag === "number");
  assert.ok(typeof first.properties.place === "string");
  assert.equal(first.geometry.type, "Point");
  assert.equal(first.geometry.coordinates.length, 3); // lon, lat, profundidad
});

test("fetchFeed lanza un error claro para un periodo invalido", async () => {
  await assert.rejects(() => fetchFeed("mes"), /Periodo desconocido/);
});

test("queryRegion trae sismos reales dentro de la caja de Mexico (API real de USGS)", async () => {
  const features = await queryRegion({
    bbox: MEXICO_BBOX,
    startTime: "2000-01-01",
    endTime: "2026-12-31",
    minMagnitude: 7,
  });
  assert.ok(features.length > 0, "se esperaban sismos historicos M7+ en la region de Mexico desde el 2000");
  for (const f of features) {
    const [lon, lat] = f.geometry.coordinates;
    assert.ok(lon >= MEXICO_BBOX.minlongitude && lon <= MEXICO_BBOX.maxlongitude);
    assert.ok(lat >= MEXICO_BBOX.minlatitude && lat <= MEXICO_BBOX.maxlatitude);
  }
});
