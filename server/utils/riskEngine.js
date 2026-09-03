import { districts, roads } from "../data/mockData.js";

// Deterministic-ish pseudo-random generator seeded by a string + time bucket,
// so "real-time" values stay stable for a few minutes (simulating a refresh
// cadence) instead of jittering on every request.
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
    h |= 0;
  }
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
}

function timeBucket(minutes = 5) {
  return Math.floor(Date.now() / (1000 * 60 * minutes));
}

// Simulated weather severity (0-100) per district. In a production system
// this calls IMD / weather API and a rainfall-intensity + soil-saturation model.
export function getWeatherSeverity() {
  const bucket = timeBucket(5);
  const out = {};
  for (const d of districts) {
    const r = seededRandom(`${d.id}-${bucket}`);
    // Remote/high-altitude districts get a higher baseline monsoon exposure.
    const base = d.tier === "remote" ? 35 : 20;
    out[d.id] = Math.round(Math.min(100, base + r * 70));
  }
  return out;
}

// Core AI-style prediction: combines terrain exposure, historical incident
// rate, and live weather severity of the two endpoints into a 0-100 risk
// score for a road segment, plus a derived status label.
export function computeRoadRisk(road, weatherByDistrict) {
  const wFrom = weatherByDistrict[road.from] ?? 30;
  const wTo = weatherByDistrict[road.to] ?? 30;
  const weatherFactor = (wFrom + wTo) / 2;
  const historyFactor = Math.min(100, road.baseIncidents * 2.5);

  const score =
    road.terrainRisk * 100 * 0.4 + weatherFactor * 0.4 + historyFactor * 0.2;

  const jitter = (seededRandom(`${road.id}-${timeBucket(5)}`) - 0.5) * 8;
  const risk = Math.max(0, Math.min(100, Math.round(score + jitter)));

  let status = "open";
  if (risk >= 75) status = "blocked";
  else if (risk >= 50) status = "high-risk";
  else if (risk >= 30) status = "caution";

  const avgSpeedKmh = status === "blocked" ? 0 : status === "high-risk" ? 20 : status === "caution" ? 35 : 50;
  const estimatedDelayMin =
    status === "blocked" ? null : Math.round((road.lengthKm / avgSpeedKmh) * 60 - (road.lengthKm / 50) * 60);

  return { risk, status, estimatedDelayMin, weatherFactor: Math.round(weatherFactor), historyFactor: Math.round(historyFactor) };
}

export function getNetworkSnapshot() {
  const weather = getWeatherSeverity();
  const roadStatus = roads.map((r) => ({ ...r, ...computeRoadRisk(r, weather) }));
  return { weather, roads: roadStatus };
}

// Risk-weighted Dijkstra over the road graph. Edge weight blends distance
// and predicted risk so the "optimal" route trades off shortest path against
// safest/most-accessible path.
export function findOptimalRoute(originId, destId, { avoidBlocked = true } = {}) {
  const { roads: roadStatus } = getNetworkSnapshot();

  const adjacency = new Map();
  for (const d of districts) adjacency.set(d.id, []);
  for (const r of roadStatus) {
    if (avoidBlocked && r.status === "blocked") continue;
    const riskPenalty = 1 + r.risk / 40; // higher risk multiplies effective distance
    const weight = r.lengthKm * riskPenalty;
    adjacency.get(r.from)?.push({ to: r.to, weight, road: r });
    adjacency.get(r.to)?.push({ to: r.from, weight, road: r });
  }

  const dist = new Map(districts.map((d) => [d.id, Infinity]));
  const prev = new Map();
  const visited = new Set();
  dist.set(originId, 0);

  while (visited.size < districts.length) {
    let u = null;
    let best = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < best) {
        best = d;
        u = id;
      }
    }
    if (u === null) break;
    visited.add(u);
    if (u === destId) break;

    for (const edge of adjacency.get(u) ?? []) {
      const alt = dist.get(u) + edge.weight;
      if (alt < dist.get(edge.to)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, { from: u, road: edge.road });
      }
    }
  }

  if (dist.get(destId) === Infinity) {
    return { found: false, reason: "No accessible route found under current conditions." };
  }

  const path = [];
  let cur = destId;
  while (cur !== originId) {
    const step = prev.get(cur);
    if (!step) break;
    path.unshift(step.road);
    cur = step.from;
  }

  const totalKm = path.reduce((s, r) => s + r.lengthKm, 0);
  const avgRisk = Math.round(path.reduce((s, r) => s + r.risk, 0) / (path.length || 1));
  const totalDelayMin = path.reduce((s, r) => s + (r.estimatedDelayMin ?? 60), 0);

  return {
    found: true,
    originId,
    destId,
    totalKm,
    avgRisk,
    estimatedExtraDelayMin: Math.max(0, totalDelayMin),
    segments: path.map((r) => ({
      roadId: r.id,
      name: r.name,
      from: r.from,
      to: r.to,
      lengthKm: r.lengthKm,
      risk: r.risk,
      status: r.status,
    })),
  };
}
