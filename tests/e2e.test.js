import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startStaticServer } from "./static-server.js";

let server;
let baseUrl;
let browser;
let page;
const consoleErrors = [];

before(async () => {
  ({ server, url: baseUrl } = await startStaticServer());
  browser = await chromium.launch();
  page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  await page.goto(baseUrl, { waitUntil: "load" });
  await page.waitForFunction(() => window.__quakesLoaded === true, { timeout: 20_000 });
});

after(async () => {
  await browser?.close();
  server?.close();
});

test("la pagina carga con el titulo correcto", async () => {
  assert.equal(await page.title(), "Sismos MX — Mapa sísmico en tiempo real");
});

test("no hay errores en la consola del navegador al cargar", () => {
  assert.deepEqual(consoleErrors, []);
});

test("Leaflet renderiza el contenedor del mapa", async () => {
  const mapContainer = await page.$(".leaflet-container");
  assert.ok(mapContainer, "se esperaba que Leaflet inicializara el mapa");
});

test("se cargaron sismos reales (datos de USGS) y se muestran en la lista", async () => {
  const quakeCount = await page.evaluate(() => window.__quakeCount);
  assert.ok(quakeCount >= 0, "quakeCount deberia ser un numero");

  const listItems = await page.$$(".quake-item");
  assert.equal(listItems.length, quakeCount, "la lista visible debe reflejar la cantidad de sismos cargados");
});

test("cambiar a región Global dispara una nueva carga de datos", async () => {
  await page.selectOption("#region-select", "global");
  await page.waitForFunction(
    () => document.getElementById("status-text").textContent.includes("actualizado"),
    { timeout: 20_000 }
  );
  const quakeCount = await page.evaluate(() => window.__quakeCount);
  assert.ok(quakeCount > 0, "el feed global deberia traer varios sismos en las ultimas 24 horas");
});

test("activar sismos historicos agrega marcadores adicionales al mapa", async () => {
  const beforeCount = await page.evaluate(() => document.querySelectorAll("path.leaflet-interactive").length);
  await page.check("#historic-toggle");
  await page.waitForTimeout(300);
  const afterCount = await page.evaluate(() => document.querySelectorAll("path.leaflet-interactive").length);
  assert.ok(afterCount > beforeCount, "se esperaban 3 marcadores historicos adicionales");
});
