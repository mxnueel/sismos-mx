import { fetchFeed, queryRegion, MEXICO_BBOX } from "./usgs.js";
import { magnitudeColor, magnitudeRadius, formatMagnitude, formatTimeAgo, filterByMinMagnitude, sortByTimeDesc } from "./format.js";
import { findNewQuakesInZone } from "./geo.js";

const AUTO_REFRESH_MS = 5 * 60 * 1000;
const ALERT_ZONE_STORAGE_KEY = "sismos-mx-alert-zone";

// Sismos historicos de referencia mas relevantes para Mexico (coordenadas y datos publicos del USGS).
const HISTORIC_QUAKES = [
  { place: "19 sep 1985 — Michoacán (sismo de Ciudad de México)", mag: 8.0, lat: 18.19, lon: -102.53 },
  { place: "19 sep 2017 — Puebla-Morelos", mag: 7.1, lat: 18.4, lon: -98.49 },
  { place: "19 sep 2022 — Michoacán", mag: 7.6, lat: 18.35, lon: -103.15 },
];

const map = L.map("map").setView([23.6, -102.5], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 18,
}).addTo(map);

const quakeLayer = L.layerGroup().addTo(map);
const historicLayer = L.layerGroup();

const regionSelect = document.getElementById("region-select");
const periodSelect = document.getElementById("period-select");
const magRange = document.getElementById("mag-range");
const magValue = document.getElementById("mag-value");
const historicToggle = document.getElementById("historic-toggle");
const refreshBtn = document.getElementById("refresh-btn");
const statusText = document.getElementById("status-text");
const quakeList = document.getElementById("quake-list");

const pickZoneBtn = document.getElementById("pick-zone-btn");
const radiusControl = document.getElementById("radius-control");
const radiusRange = document.getElementById("radius-range");
const radiusValue = document.getElementById("radius-value");
const enableAlertsBtn = document.getElementById("enable-alerts-btn");
const alertStatus = document.getElementById("alert-status");

let alertZone = JSON.parse(localStorage.getItem(ALERT_ZONE_STORAGE_KEY) ?? "null");
let pickingZone = false;
let alertsEnabled = false;
let lastFeatures = [];
let seenQuakeIds = new Set();
let zoneMarker = null;
let zoneCircle = null;

function drawZoneOnMap() {
  if (zoneMarker) map.removeLayer(zoneMarker);
  if (zoneCircle) map.removeLayer(zoneCircle);
  if (!alertZone) return;
  zoneMarker = L.marker([alertZone.lat, alertZone.lon]).addTo(map);
  zoneCircle = L.circle([alertZone.lat, alertZone.lon], {
    radius: alertZone.radiusKm * 1000,
    color: "#4da3ff",
    fillOpacity: 0.08,
  }).addTo(map);
}

function saveAlertZone() {
  localStorage.setItem(ALERT_ZONE_STORAGE_KEY, JSON.stringify(alertZone));
}

function checkAlerts(features) {
  if (!alertsEnabled || !alertZone) return;
  const newInZone = findNewQuakesInZone(features, alertZone, seenQuakeIds);
  for (const f of newInZone) {
    const { mag, place, time } = f.properties;
    if (Notification.permission === "granted") {
      new Notification(`Sismo ${formatMagnitude(mag)} en tu zona`, {
        body: `${place}\n${formatTimeAgo(time)}`,
      });
    }
  }
  for (const f of features) seenQuakeIds.add(f.id);
}

function periodToStartTime(period) {
  const now = new Date();
  const ms = { hour: 60 * 60 * 1000, day: 24 * 60 * 60 * 1000, week: 7 * 24 * 60 * 60 * 1000 }[period];
  return new Date(now.getTime() - ms).toISOString();
}

async function loadQuakes() {
  const region = regionSelect.value;
  const period = periodSelect.value;
  const minMag = Number(magRange.value);

  statusText.textContent = "Cargando...";
  refreshBtn.disabled = true;

  try {
    const features =
      region === "mexico"
        ? await queryRegion({ bbox: MEXICO_BBOX, startTime: periodToStartTime(period), endTime: new Date().toISOString(), minMagnitude: minMag })
        : filterByMinMagnitude(await fetchFeed(period), minMag);

    renderQuakes(features);
    statusText.textContent = `${features.length} sismo(s) — actualizado ${formatTimeAgo(Date.now())}`;
    checkAlerts(features);
    lastFeatures = features;
    window.__quakeCount = features.length; // gancho para pruebas end-to-end
    window.__quakesLoaded = true;
  } catch (err) {
    statusText.textContent = `Error al cargar datos: ${err instanceof Error ? err.message : err}`;
    window.__quakesLoaded = false;
  } finally {
    refreshBtn.disabled = false;
  }
}

function renderQuakes(features) {
  quakeLayer.clearLayers();
  quakeList.innerHTML = "";

  const sorted = sortByTimeDesc(features);

  sorted.forEach((feature, index) => {
    const [lon, lat, depth] = feature.geometry.coordinates;
    const { mag, place, time, url } = feature.properties;

    const marker = L.circleMarker([lat, lon], {
      radius: magnitudeRadius(mag),
      color: magnitudeColor(mag),
      fillColor: magnitudeColor(mag),
      fillOpacity: 0.6,
      weight: 1,
    });
    marker.bindPopup(
      `<strong>${formatMagnitude(mag)}</strong> — ${place}<br>${formatTimeAgo(time)}<br>Profundidad: ${depth?.toFixed(1) ?? "?"} km<br><a href="${url}" target="_blank" rel="noopener">Ver detalle en USGS</a>`
    );
    marker.addTo(quakeLayer);

    const li = document.createElement("li");
    li.className = "quake-item";
    li.style.setProperty("--i", Math.min(index, 20));
    li.innerHTML = `<span class="quake-mag" style="color:${magnitudeColor(mag)}">${formatMagnitude(mag)}</span><span class="quake-place">${place}</span><br><span class="quake-time">${formatTimeAgo(time)}</span>`;
    li.addEventListener("click", () => {
      map.setView([lat, lon], 7);
      marker.openPopup();
    });
    quakeList.appendChild(li);
  });
}

function renderHistoricQuakes() {
  historicLayer.clearLayers();
  for (const q of HISTORIC_QUAKES) {
    L.circleMarker([q.lat, q.lon], {
      radius: magnitudeRadius(q.mag),
      color: "#ffffff",
      fillColor: magnitudeColor(q.mag),
      fillOpacity: 0.4,
      weight: 2,
      dashArray: "3,3",
    })
      .bindPopup(`<strong>${formatMagnitude(q.mag)}</strong> — ${q.place} (histórico)`)
      .addTo(historicLayer);
  }
}

regionSelect.addEventListener("change", loadQuakes);
periodSelect.addEventListener("change", loadQuakes);
magRange.addEventListener("input", () => {
  magValue.textContent = magRange.value;
});
magRange.addEventListener("change", loadQuakes);
refreshBtn.addEventListener("click", loadQuakes);
historicToggle.addEventListener("change", () => {
  if (historicToggle.checked) {
    historicLayer.addTo(map);
  } else {
    map.removeLayer(historicLayer);
  }
});

pickZoneBtn.addEventListener("click", () => {
  pickingZone = !pickingZone;
  pickZoneBtn.classList.toggle("active", pickingZone);
  pickZoneBtn.textContent = pickingZone ? "Click en el mapa..." : "Elegir mi zona en el mapa";
});

map.on("click", (e) => {
  if (!pickingZone) return;
  alertZone = { lat: e.latlng.lat, lon: e.latlng.lng, radiusKm: Number(radiusRange.value) };
  drawZoneOnMap();
  saveAlertZone();
  pickingZone = false;
  pickZoneBtn.classList.remove("active");
  pickZoneBtn.textContent = "Elegir mi zona en el mapa";
  radiusControl.hidden = false;
  enableAlertsBtn.disabled = false;
  alertStatus.textContent = `Zona guardada (radio ${alertZone.radiusKm} km). Activa las alertas cuando quieras.`;
});

radiusRange.addEventListener("input", () => {
  radiusValue.textContent = radiusRange.value;
  if (alertZone) {
    alertZone.radiusKm = Number(radiusRange.value);
    drawZoneOnMap();
    saveAlertZone();
  }
});

enableAlertsBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alertStatus.textContent = "Tu navegador no soporta notificaciones.";
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alertStatus.textContent = "Permiso de notificaciones denegado.";
    return;
  }
  seenQuakeIds = new Set(lastFeatures.map((f) => f.id));
  alertsEnabled = true;
  enableAlertsBtn.classList.add("enabled");
  enableAlertsBtn.textContent = "Alertas activas";
  alertStatus.textContent = "Te avisaremos aquí si hay un sismo nuevo en tu zona (mientras esta pestaña esté abierta).";
});

if (alertZone) {
  drawZoneOnMap();
  radiusRange.value = String(alertZone.radiusKm);
  radiusValue.textContent = String(alertZone.radiusKm);
  radiusControl.hidden = false;
  enableAlertsBtn.disabled = false;
}

renderHistoricQuakes();
loadQuakes();
setInterval(loadQuakes, AUTO_REFRESH_MS);
