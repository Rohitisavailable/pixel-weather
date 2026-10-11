const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const placeEl = document.getElementById("place");
const tempEl = document.getElementById("temp");
const conditionEl = document.getElementById("condition");
const feelsEl = document.getElementById("feels");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const forecastEl = document.getElementById("forecast");
const unitBtn = document.getElementById("unit-btn");
const cityInput = document.getElementById("city-input");

let useFahrenheit = false;
let weather = null;
let previewDay = null;
let forceKind = null;
let tick = 0;

const rainDrops = Array.from({ length: 48 }, () => ({
  x: Math.random() * 320,
  y: Math.random() * 180,
  len: 4 + Math.floor(Math.random() * 6),
  speed: 2 + Math.random() * 2.4,
}));

const fogBanks = Array.from({ length: 6 }, (_, i) => ({
  y: 40 + i * 18,
  x: Math.random() * 320,
  w: 70 + Math.random() * 90,
  speed: 0.15 + i * 0.04,
}));

const gusts = Array.from({ length: 18 }, () => ({
  x: Math.random() * 320,
  y: 20 + Math.random() * 110,
  w: 10 + Math.random() * 18,
  speed: 1.4 + Math.random() * 1.8,
}));

const leaves = Array.from({ length: 10 }, () => ({
  x: Math.random() * 320,
  y: 40 + Math.random() * 90,
  spin: Math.random() * Math.PI,
  speed: 0.8 + Math.random() * 1.2,
}));

const palettes = {
  sun: { skyTop: "#3d89ff", skyBot: "#b4e2ff", ground: "#5aad3a", dirt: "#8b5a2b" },
  rain: { skyTop: "#24344a", skyBot: "#4a5f78", ground: "#3d6a32", dirt: "#5a3d24" },
  fog: { skyTop: "#8a97a6", skyBot: "#c5cdd4", ground: "#6e8a58", dirt: "#6a5340" },
  wind: { skyTop: "#4aa3c8", skyBot: "#d7f0ff", ground: "#6bbf45", dirt: "#8b5a2b" },
  storm: { skyTop: "#1a2030", skyBot: "#3a4258", ground: "#355a2e", dirt: "#4a3322" },
  night: { skyTop: "#0d1024", skyBot: "#24305a", ground: "#2e5a28", dirt: "#3d2918" },
};

function wmoLabel(code) {
  if (code === 0) return "CLEAR SKY";
  if (code <= 3) return "PARTLY CLOUDY";
  if (code === 45 || code === 48) return "FOG";
  if (code <= 57) return "DRIZZLE";
  if (code <= 67) return "RAIN";
  if (code <= 77) return "SNOW";
  if (code <= 82) return "SHOWERS";
  if (code <= 86) return "SNOW SHOWERS";
  return "THUNDER";
}

function sceneKind(code, windKmh, isDay) {
  if (!isDay) return "night";
  if (code >= 95) return "storm";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (windKmh >= 28) return "wind";
  return "sun";
}

function toTemp(c) {
  return useFahrenheit ? Math.round((c * 9) / 5 + 32) : Math.round(c);
}

function unitSymbol() {
  return useFahrenheit ? "F" : "C";
}

function pset(x, y, color, size = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

function drawSky(kind) {
  const pal = palettes[kind];
  const g = ctx.createLinearGradient(0, 0, 0, 180);
  g.addColorStop(0, pal.skyTop);
  g.addColorStop(1, pal.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 320, 180);
}

function drawSun(kind) {
  if (kind !== "sun" && kind !== "wind") return;
  const cx = 250;
  const cy = 42;
  const pulse = 1 + Math.floor(Math.sin(tick / 18) * 1.5);
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4 + tick / 40;
    const x = cx + Math.cos(ang) * (18 + pulse);
    const y = cy + Math.sin(ang) * (18 + pulse);
    rect(x - 2, y - 1, 5, 2, "#ffdd55");
    rect(x - 1, y - 2, 2, 5, "#ffdd55");
  }
  rect(cx - 10, cy - 10, 20, 20, "#ffe566");
  rect(cx - 8, cy - 12, 16, 24, "#ffcc33");
  rect(cx - 12, cy - 8, 24, 16, "#ffcc33");
  rect(cx - 6, cy - 6, 12, 12, "#fff1a8");
}

function drawMoon() {
  rect(250, 28, 16, 16, "#e8e0c8");
  rect(248, 32, 20, 8, "#e8e0c8");
  rect(254, 26, 8, 20, "#e8e0c8");
  rect(256, 32, 6, 6, "#c8c0a8");
}

function drawCloud(x, y, color = "#f2f2f2", shade = "#c8d0d8") {
  rect(x + 8, y, 28, 8, color);
  rect(x, y + 6, 48, 10, color);
  rect(x + 6, y + 14, 36, 6, shade);
}

function drawClouds(kind) {
  if (kind === "sun") {
    drawCloud(18 + Math.sin(tick / 50) * 6, 22);
    return;
  }
  const drift = (tick * (kind === "wind" ? 1.4 : 0.4)) % 360;
  drawCloud((20 + drift) % 340 - 20, 18, kind === "storm" ? "#6d7384" : "#e8eef4");
  drawCloud((140 + drift * 0.7) % 340 - 20, 36, kind === "storm" ? "#555b6c" : "#d9e2ea");
  if (kind === "rain" || kind === "storm" || kind === "fog") {
    drawCloud((80 + drift * 0.5) % 340 - 20, 10, "#9aa3b0", "#7c8592");
  }
}

function drawRain() {
  ctx.fillStyle = "#9ad7ff";
  for (const d of rainDrops) {
    d.y += d.speed;
    d.x -= 0.4;
    if (d.y > 150) {
      d.y = -8;
      d.x = Math.random() * 320;
    }
    if (d.x < 0) d.x += 320;
    ctx.fillRect(Math.floor(d.x), Math.floor(d.y), 1, d.len);
  }
}

function drawFog() {
  ctx.fillStyle = "rgba(210, 218, 224, 0.35)";
  ctx.fillRect(0, 50, 320, 102);
  for (const f of fogBanks) {
    f.x += f.speed;
    if (f.x > 320) f.x = -f.w;
    ctx.fillStyle = "rgba(240, 244, 246, 0.45)";
    rect(f.x, f.y, f.w, 12);
    rect(f.x + 8, f.y - 5, f.w * 0.75, 10);
    rect(f.x + 16, f.y + 6, f.w * 0.5, 8);
  }
}

function drawWind() {
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (const g of gusts) {
    g.x += g.speed;
    if (g.x > 330) {
      g.x = -20;
      g.y = 20 + Math.random() * 110;
    }
    rect(g.x, g.y, g.w, 1);
    rect(g.x + g.w - 3, g.y - 2, 3, 1);
  }
  for (const leaf of leaves) {
    leaf.x += leaf.speed;
    leaf.y += Math.sin(tick / 8 + leaf.spin) * 0.6;
    leaf.spin += 0.12;
    if (leaf.x > 330) {
      leaf.x = -6;
      leaf.y = 40 + Math.random() * 90;
    }
    const wobble = Math.sin(leaf.spin) * 2;
    rect(leaf.x, leaf.y + wobble, 3, 2, "#d45a1a");
    rect(leaf.x + 2, leaf.y + wobble + 1, 2, 2, "#7bcf3a");
  }
}

function drawTree(x, sway, pal) {
  const top = 108 + sway;
  rect(x + 6, 128, 6, 24, pal.dirt);
  rect(x, top, 18, 14, "#2f7a28");
  rect(x + 4, top - 8, 10, 10, "#3d9a32");
  rect(x + 6, top - 12, 6, 6, "#4cbf3c");
}

function drawHouse(x, pal) {
  rect(x, 126, 36, 26, "#c45c48");
  rect(x + 2, 128, 32, 22, "#e07a62");
  rect(x + 10, 114, 16, 12, "#6b2d22");
  rect(x + 6, 118, 24, 10, "#8a3a2c");
  rect(x + 22, 136, 8, 16, pal.dirt);
  rect(x + 8, 136, 8, 8, "#7ec8ff");
}

function drawGround(kind, windy) {
  const pal = palettes[kind];
  rect(0, 152, 320, 28, pal.ground);
  rect(0, 150, 320, 4, pal.dirt);
  for (let i = 0; i < 40; i++) {
    pset(i * 8 + ((tick / 6) % 8) * (windy ? 1 : 0), 150, "#3d7a28");
  }
  const sway = windy ? Math.round(Math.sin(tick / 8) * 3) : Math.round(Math.sin(tick / 30) * 1);
  drawTree(28, sway, pal);
  drawTree(70, -sway, pal);
  drawHouse(128, pal);
  drawTree(232, sway, pal);
  drawTree(278, -sway, pal);
}

function drawLightning() {
  if (tick % 90 < 3) {
    ctx.fillStyle = "rgba(255,255,220,0.35)";
    ctx.fillRect(0, 0, 320, 150);
  }
  if (tick % 90 === 1) {
    rect(160, 20, 4, 28, "#fffbe6");
    rect(162, 46, 12, 4, "#fffbe6");
    rect(170, 48, 4, 22, "#fffbe6");
  }
}

function renderScene() {
  tick += 1;
  const source = previewDay || weather?.current;
  const kind =
    forceKind ||
    (source ? sceneKind(source.code, source.wind, source.isDay !== false) : "sun");
  const windy = kind === "wind" || (source && source.wind >= 28);
  drawSky(kind);
  if (kind === "night") drawMoon();
  else drawSun(kind);
  drawClouds(kind);
  if (kind === "rain" || kind === "storm") drawRain();
  if (kind === "fog") drawFog();
  if (kind === "wind" || windy) drawWind();
  if (kind === "storm") drawLightning();
  drawGround(kind, windy);
  requestAnimationFrame(renderScene);
}

async function geocode(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    name
  )}&count=1&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results?.length) throw new Error("City not found");
  const c = data.results[0];
  return {
    lat: c.latitude,
    lon: c.longitude,
    label: [c.name, c.admin1 !== c.name ? c.admin1 : null, c.country_code]
      .filter(Boolean)
      .join(", "),
  };
}

async function loadWeather(lat, lon, label) {
  placeEl.textContent = "LOADING PIXELS...";
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max` +
    `&timezone=auto&forecast_days=6`;
  const res = await fetch(url);
  const data = await res.json();
  weather = {
    label,
    current: {
      temp: data.current.temperature_2m,
      feels: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m,
      code: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
    days: data.daily.time.slice(1, 6).map((date, i) => ({
      date,
      code: data.daily.weather_code[i + 1],
      max: data.daily.temperature_2m_max[i + 1],
      min: data.daily.temperature_2m_min[i + 1],
      wind: data.daily.wind_speed_10m_max[i + 1],
      isDay: true,
    })),
  };
  previewDay = null;
  renderUI();
}

function iconFor(code, wind) {
  if (code === 45 || code === 48) return "FOG";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "RAIN";
  if (code >= 95) return "STORM";
  if (code >= 71 && code <= 86) return "SNOW";
  if (wind >= 28) return "WIND";
  if (code === 0) return "SUN";
  return "CLOUD";
}

function renderUI() {
  if (!weather) return;
  const c = weather.current;
  placeEl.textContent = weather.label.toUpperCase();
  tempEl.textContent = `${toTemp(c.temp)}°${unitSymbol()}`;
  conditionEl.textContent = wmoLabel(c.code);
  feelsEl.textContent = `FEELS ${toTemp(c.feels)}°`;
  humidityEl.textContent = `HUM ${Math.round(c.humidity)}%`;
  windEl.textContent = `WIND ${Math.round(c.wind)} KM/H`;
  unitBtn.textContent = `°${unitSymbol()}`;

  forecastEl.innerHTML = "";
  weather.days.forEach((day, idx) => {
    const btn = document.createElement("button");
    btn.className = "day" + (previewDay === day ? " active" : "");
    btn.type = "button";
    const dow = new Date(day.date + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "short",
    });
    btn.innerHTML = `
      <div class="dow">${dow.toUpperCase()}</div>
      <div class="icon">${iconFor(day.code, day.wind)}</div>
      <div class="hi">${toTemp(day.max)}° ${unitSymbol()}</div>
      <div class="lo">${toTemp(day.min)}°</div>
    `;
    btn.addEventListener("click", () => {
      previewDay = previewDay === day ? null : day;
      forceKind = null;
      renderUI();
    });
    forecastEl.appendChild(btn);
    if (idx === 0 && !previewDay) btn.classList.remove("active");
  });
}

document.getElementById("search-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = cityInput.value.trim();
  if (!q) return;
  try {
    const loc = await geocode(q);
    await loadWeather(loc.lat, loc.lon, loc.label);
  } catch (err) {
    placeEl.textContent = "NO CITY FOUND";
    conditionEl.textContent = err.message.toUpperCase();
  }
});

document.getElementById("geo-btn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    placeEl.textContent = "NO GPS";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await loadWeather(pos.coords.latitude, pos.coords.longitude, "YOUR PIXEL TOWN");
    },
    () => {
      placeEl.textContent = "GPS BLOCKED";
    }
  );
});

unitBtn.addEventListener("click", () => {
  useFahrenheit = !useFahrenheit;
  renderUI();
});

document.querySelectorAll("[data-fx]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const kind = btn.dataset.fx;
    forceKind = forceKind === kind ? null : kind;
    previewDay = null;
  });
});

renderScene();

(async function boot() {
  try {
    const loc = await geocode("Tokyo");
    await loadWeather(loc.lat, loc.lon, loc.label);
  } catch {
    placeEl.textContent = "SEARCH A CITY TO START";
  }
})();
