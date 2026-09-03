import express from "express";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";

import districtsRouter from "./routes/districts.js";
import roadsRouter from "./routes/roads.js";
import alertsRouter, {
  buildAlerts
} from "./routes/alerts.js";
import vehiclesRouter, {
  getLiveVehicles
} from "./routes/vehicles.js";
import reportsRouter from "./routes/reports.js";
import weatherRouter from "./routes/weather.js";

import {
  getNetworkSnapshot
} from "./utils/riskEngine.js";

import {
  vehicles as vehicleStore,
  roads as roadDefs
} from "./data/mockData.js";


const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});


/* -----------------------------
   MIDDLEWARE
----------------------------- */

app.use(cors());

app.use(express.json());

app.use(morgan("dev"));


/* -----------------------------
   HEALTH CHECK
----------------------------- */

app.get("/", (req, res) => {
  res.json({
    name: "Prayaan Logistics Intelligence Platform",
    status: "running",
    timestamp: new Date().toISOString()
  });
});


/* -----------------------------
   API ROUTES
----------------------------- */

app.use("/api/districts", districtsRouter);

app.use("/api/roads", roadsRouter);

app.use("/api/alerts", alertsRouter);

app.use("/api/vehicles", vehiclesRouter);

app.use("/api/reports", reportsRouter);

app.use("/api/weather", weatherRouter);


/* -----------------------------
   NETWORK SNAPSHOT
----------------------------- */

app.get("/api/snapshot", async (req, res) => {
  try {

    const snapshot =
      await getNetworkSnapshot();

    const liveVehicles =
      await getLiveVehicles();

    const alerts =
      await buildAlerts();


    res.json({
      ...snapshot,

      vehicles: liveVehicles,

      alerts,

      generatedAt: Date.now()
    });

  } catch (error) {

    console.error(
      "Snapshot API error:",
      error
    );

    res.status(500).json({
      error: "Unable to generate network snapshot",
      message: error.message
    });
  }
});


/* -----------------------------
   SOCKET.IO
----------------------------- */

io.on("connection", async (socket) => {

  console.log(
    `Client connected: ${socket.id}`
  );


  try {

    const snapshot =
      await getNetworkSnapshot();

    const liveVehicles =
      await getLiveVehicles();

    const alerts =
      await buildAlerts();


    socket.emit("snapshot", {

      ...snapshot,

      vehicles: liveVehicles,

      alerts

    });

  } catch (error) {

    console.error(
      "Socket snapshot error:",
      error
    );

    socket.emit("error", {
      message:
        "Unable to generate live snapshot"
    });
  }


  socket.on("disconnect", () => {

    console.log(
      `Client disconnected: ${socket.id}`
    );

  });

});


/* -----------------------------
   LIVE UPDATE LOOP
----------------------------- */

setInterval(async () => {

  try {

    /*
     * Move simulated vehicle
     * positions forward.
     *
     * NOTE:
     * Vehicle GPS will be replaced
     * with real GPS/device data later.
     */

    for (const vehicle of vehicleStore) {

      if (
        vehicle.status === "in-transit" ||
        vehicle.status === "delayed"
      ) {

        vehicle.progress += 0.002;

        if (vehicle.progress >= 1) {
          vehicle.progress = 0;
        }

      }

    }


    const liveVehicles =
      await getLiveVehicles();

    const alerts =
      await buildAlerts();

    const snapshot =
      await getNetworkSnapshot();


    io.emit(
      "vehicles",
      liveVehicles
    );


    io.emit(
      "alerts",
      alerts
    );


    io.emit(
      "network",
      snapshot
    );

  } catch (error) {

    console.error(
      "Live update error:",
      error
    );

  }

}, 4000);


/* -----------------------------
   SERVER
----------------------------- */

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,
  () => {

    console.log(
      `Prayaan backend running on http://localhost:${PORT}`
    );

    console.log(
      `API available at http://localhost:${PORT}/api`
    );

  }
);