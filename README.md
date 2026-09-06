# Prayaan — NER Logistics & Accessibility Intelligence Platform

AI-enabled logistics intelligence platform prototype for the North Eastern Region: real-time road
accessibility monitoring, predictive disruption risk scoring, AI-based alternate route suggestion,
GPS shipment tracking, live alerts, and offline-capable field reporting.

## Stack

- **Backend**: Node.js, Express, Socket.io (real-time push), in-memory mock data + a risk-scoring
  engine that blends terrain exposure, historical incident rate, and simulated weather severity into
  a 0–100 risk score per road segment, plus a risk-weighted Dijkstra route optimizer.
- **Frontend**: React (Vite), react-leaflet for the GIS map, socket.io-client for live updates,
  offline-queueing for field reports (syncs automatically on reconnect).

## Project structure

```
ner-logistics/
├── server/           Express API + Socket.io real-time layer
│   ├── data/          Mock districts, road network graph, vehicles, field reports
│   ├── routes/        REST endpoints: districts, roads, alerts, vehicles, reports, weather
│   ├── utils/          Risk-scoring engine + route optimizer
│   └── server.js
└── client/           React dashboard
    └── src/
        ├── api/        API client
        └── components/ TopBar, Sidebar, MapView, AlertsFeed, DistrictPanel, VehicleTracker, FieldReportForm
```

## Running locally

Requires Node.js 18+.

**1. Start the backend**
```bash
cd server
npm install
npm run dev        # http://localhost:5000
```

**2. Start the frontend** (in a new terminal)
```bash
cd client
npm install
npm run dev         # http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` and `/socket.io` to the backend, so no
extra config is needed.

## Running with Docker & Docker Compose

To run the entire platform with Docker:

```bash
docker compose up --build
```

This starts two containers:
1. **`pragyaan-backend`**: Express API + Socket.io server running on Node 20 (`http://localhost:5000`) with built-in healthcheck.
2. **`pragyaan-frontend`**: Production multi-stage build served via Nginx on `http://localhost:5173`, with automatic reverse proxying for `/api` and `/socket.io` to the backend container.

To stop the containers:
```bash
docker compose down
```

## What's implemented vs. what's mocked

This is a working prototype scaffold demonstrating the full data flow end-to-end:

- **Real**: Express REST API, Socket.io live push, risk-weighted route optimization (Dijkstra over the
  road graph), offline-queue-and-sync for field reports, live-updating Leaflet map, vehicle position
  interpolation along routes.
- **Mocked / to be swapped for production**: weather severity (currently a seeded pseudo-random
  simulation — swap `getWeatherSeverity()` in `server/utils/riskEngine.js` for a real IMD/weather API
  call), GPS vehicle telemetry (currently simulated progress — swap for real device/OBD GPS ingestion),
  road/bridge network (currently 15 hand-placed NER corridors — swap for PWD/Survey of India GIS
  shapefiles via PostGIS), and persistence (currently in-memory arrays — swap for PostgreSQL/PostGIS).

## Extending toward the full problem statement

- Swap in a trained ML model (e.g. XGBoost/LSTM) in place of the heuristic formula in
  `computeRoadRisk()`, trained on historical landslide/flood incident data per segment.
- Add satellite imagery ingestion (Bhuvan/ISRO) for visual landslide/flood detection on field-reported
  photos.
- Add SMS/IVR notification fallback (Twilio or a local telecom gateway) for low-connectivity multilingual
  alerts.
- Move the mobile field-reporting surface to a proper offline-first mobile app (React Native/Flutter)
  using the same `/api/reports` contract already built here.
