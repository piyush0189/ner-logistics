import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";

import districtsRouter from "./routes/districts.js";
import roadsRouter from "./routes/roads.js";
import alertsRouter, { buildAlerts } from "./routes/alerts.js";
import vehiclesRouter, { getLiveVehicles } from "./routes/vehicles.js";
import reportsRouter from "./routes/reports.js";
import weatherRouter from "./routes/weather.js";
import { getNetworkSnapshot } from "./utils/riskEngine.js";
import { vehicles as vehicleStore, roads as roadDefs } from "./data/mockData.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ner-logistics-server", time: new Date().toISOString() });
});

app.use("/api/districts", districtsRouter);
app.use("/api/roads", roadsRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/weather", weatherRouter);

app.get("/api/snapshot", (req, res) => {
  res.json({
    ...getNetworkSnapshot(),
    vehicles: getLiveVehicles(),
    alerts: buildAlerts(),
    generatedAt: Date.now(),
  });
});

// --- Real-time layer -------------------------------------------------
// Advances each vehicle along its road on a tick, broadcasts fresh
// positions + alerts to all connected dashboard/mobile clients, and
// simulates GPS pings for field-level tracking.
function advanceVehicles() {
  for (const v of vehicleStore) {
    if (v.status === "delayed") continue;
    const road = roadDefs.find((r) => r.id === v.roadId);
    const step = 1 / (road.lengthKm / 8); // roughly a few km per tick
    v.progress = Math.min(1, v.progress + step);
    if (v.progress >= 1) {
      v.progress = 0;
      const wasFrom = v.originId;
      v.originId = v.destId;
      v.destId = wasFrom;
      v.direction = v.direction === "forward" ? "reverse" : "forward";
    }
  }
}

io.on("connection", (socket) => {
  socket.emit("snapshot", {
    ...getNetworkSnapshot(),
    vehicles: getLiveVehicles(),
    alerts: buildAlerts(),
  });
});

setInterval(() => {
  advanceVehicles();
  io.emit("vehicles", getLiveVehicles());
  io.emit("alerts", buildAlerts());
}, 4000);

httpServer.listen(PORT, () => {
  console.log(`NER Logistics Intelligence server running on http://localhost:${PORT}`);
});
