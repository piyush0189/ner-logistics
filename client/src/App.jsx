import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import TopBar from "./components/TopBar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import MapView from "./components/MapView.jsx";
import AlertsFeed from "./components/AlertsFeed.jsx";
import DistrictPanel from "./components/DistrictPanel.jsx";
import VehicleTracker from "./components/VehicleTracker.jsx";
import FieldReportForm from "./components/FieldReportForm.jsx";

import {
  getDistricts,
  getRoads,
  getOptimalRoute,
} from "./api/client.js";


export default function App() {

  const [view, setView] = useState("dashboard");
  const [connected, setConnected] = useState(false);

  const [districts, setDistricts] = useState([]);
  const [roads, setRoads] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [highlightRoadIds, setHighlightRoadIds] = useState([]);

  const [routeResult, setRouteResult] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");


  async function loadStatic() {

    try {

      const [d, r] = await Promise.all([
        getDistricts(),
        getRoads(),
      ]);

      setDistricts(d.districts);
      setRoads(r.roads);

    } catch (error) {

      console.error(
        "Failed to load network data:",
        error
      );

    }

  }


  async function handleRoute(originId, destId) {

    if (!originId || !destId) {
      return;
    }


    if (originId === destId) {

      setRouteError(
        "Origin and destination must be different."
      );

      setRouteResult(null);
      setHighlightRoadIds([]);

      return;
    }


    try {

      setRouteLoading(true);
      setRouteError("");
      setRouteResult(null);
      setHighlightRoadIds([]);


      const result =
        await getOptimalRoute(
          originId,
          destId
        );


      if (!result.found) {

        setRouteError(
          result.reason ||
          "No accessible route found."
        );

        return;
      }


      setRouteResult(result);


      const roadIds =
        result.segments?.map(
          (segment) => segment.roadId
        ) || [];


      setHighlightRoadIds(roadIds);

    } catch (error) {

      console.error(
        "Route planning failed:",
        error
      );


      setRouteError(
        "Unable to calculate the optimal route."
      );

    } finally {

      setRouteLoading(false);

    }

  }


  useEffect(() => {

    loadStatic();


    const socket = io("/", {
      path: "/socket.io",
    });


    socket.on("connect", () => {

      setConnected(true);

    });


    socket.on("disconnect", () => {

      setConnected(false);

    });


    socket.on("snapshot", (data) => {

      setVehicles(
        data.vehicles || []
      );

      setAlerts(
        data.alerts || []
      );

    });


    socket.on("vehicles", (data) => {

      setVehicles(data || []);

    });


    socket.on("alerts", (data) => {

      setAlerts(data || []);

    });


    const staticRefresh =
      setInterval(
        loadStatic,
        30000
      );


    return () => {

      socket.disconnect();

      clearInterval(
        staticRefresh
      );

    };

  }, []);


  const criticalCount =
    alerts.filter(
      (a) =>
        a.severity === "critical"
    ).length;


  const atRiskDistricts =
    districts.filter(
      (d) =>
        d.connectivity !== "connected"
    ).length;


  return (

    <div className="app-shell">

      <TopBar
        connected={connected}
      />


      <Sidebar
        view={view}
        setView={setView}
      />


      <main className="main">


        {view === "dashboard" && (

          <div className="dashboard-page">


            <div className="kpi-grid">


              <div className="kpi-card">

                <div className="kpi-label">
                  DISTRICTS AT RISK
                </div>

                <div className="kpi-value">
                  {atRiskDistricts}
                </div>

                <div className="kpi-note">
                  Connectivity degraded
                </div>

              </div>


              <div className="kpi-card">

                <div className="kpi-label">
                  SHIPMENTS IN TRANSIT
                </div>

                <div className="kpi-value">
                  {vehicles.length}
                </div>

                <div className="kpi-note">
                  GPS monitored
                </div>

              </div>


              <div className="kpi-card">

                <div className="kpi-label">
                  CORRIDORS MONITORED
                </div>

                <div className="kpi-value">
                  {roads.length}
                </div>

                <div className="kpi-note">
                  Network coverage
                </div>

              </div>


              <div className="kpi-card critical-kpi">

                <div className="kpi-label">
                  CRITICAL ALERTS
                </div>

                <div className="kpi-value">
                  {criticalCount}
                </div>

                <div className="kpi-note">
                  Immediate attention
                </div>

              </div>


            </div>


            <div className="dashboard-grid">


              <div className="panel map-panel">


                <div className="panel-header">

                  <div>

                    <div className="panel-title">
                      Network accessibility map
                    </div>

                    <div className="panel-subtitle">
                      Live road conditions, districts & shipment positions
                    </div>

                  </div>


                  <span className="alert-meta">
                    {roads.length} CORRIDORS MONITORED
                  </span>

                </div>


                <div className="map-wrap">

                  <MapView
                    districts={districts}
                    roads={roads}
                    vehicles={vehicles}
                    highlightRoadIds={highlightRoadIds}
                  />

                </div>


              </div>


              <div className="panel alerts-panel">


                <div className="panel-header">

                  <div>

                    <div className="panel-title">
                      Priority alerts
                    </div>

                    <div className="panel-subtitle">
                      Active network disruptions
                    </div>

                  </div>


                  <span className="critical-count">
                    {criticalCount} CRITICAL
                  </span>

                </div>


                <div className="panel-body">

                  <AlertsFeed
                    alerts={alerts}
                  />

                </div>


              </div>


            </div>


          </div>

        )}


        {view === "districts" && (

          <div
            className="panel"
            style={{
              height: "calc(100vh - 104px)"
            }}
          >


            <div className="panel-header">

              <span className="panel-title">
                Districts & route planning
              </span>

            </div>


            <div className="panel-body">

              <DistrictPanel
                districts={districts}
                onRoute={handleRoute}
              />


              {routeLoading && (

                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    fontFamily:
                      "IBM Plex Sans, sans-serif"
                  }}
                >
                  Calculating safest route...
                </div>

              )}


              {routeError && (

                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    border:
                      "1px solid #c1502e",
                    fontFamily:
                      "IBM Plex Sans, sans-serif"
                  }}
                >
                  {routeError}
                </div>

              )}


              {routeResult && (

                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    border:
                      "1px solid #5b8c5a",
                    fontFamily:
                      "IBM Plex Sans, sans-serif"
                  }}
                >

                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: "10px"
                    }}
                  >
                    Optimal Route
                  </div>


                  <div>
                    Distance:{" "}
                    <strong>
                      {routeResult.totalKm} km
                    </strong>
                  </div>


                  <div>
                    Driving time:{" "}
                    <strong>
                      {routeResult.totalDurationMin ??
                        "Unavailable"}{" "}
                      min
                    </strong>
                  </div>


                  <div>
                    Average risk:{" "}
                    <strong>
                      {routeResult.avgRisk}/100
                    </strong>
                  </div>


                  <div>
                    Extra delay:{" "}
                    <strong>
                      {routeResult.estimatedExtraDelayMin}{" "}
                      min
                    </strong>
                  </div>


                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      opacity: 0.7
                    }}
                  >
                    Source:{" "}
                    {routeResult.routingSource ||
                      "Prayaan routing engine"}
                  </div>


                  {routeResult.segments &&
                    routeResult.segments.length > 0 && (

                      <div
                        style={{
                          marginTop: "12px"
                        }}
                      >

                        <div
                          style={{
                            fontWeight: 600,
                            marginBottom: "6px"
                          }}
                        >
                          Route segments
                        </div>


                        {routeResult.segments.map(
                          (segment) => (

                            <div
                              key={
                                segment.roadId
                              }
                              style={{
                                padding:
                                  "6px 0"
                              }}
                            >

                              {segment.name}

                              {" — "}

                              {segment.lengthKm} km

                              {" — Risk "}

                              {segment.risk}/100

                            </div>

                          )
                        )}

                      </div>

                    )}


                </div>

              )}


            </div>

          </div>

        )}


        {view === "vehicles" && (

          <div
            className="panel"
            style={{
              height: "calc(100vh - 104px)"
            }}
          >


            <div className="panel-header">

              <span className="panel-title">
                Shipment tracking
              </span>


              <span className="alert-meta">
                GPS-integrated, live positions
              </span>

            </div>


            <div className="panel-body">

              <VehicleTracker
                vehicles={vehicles}
              />

            </div>


          </div>

        )}


        {view === "reports" && (

          <div
            className="panel"
            style={{
              height: "calc(100vh - 104px)"
            }}
          >


            <div className="panel-header">

              <span className="panel-title">
                Field reporting
              </span>


              <span className="alert-meta">
                Offline-capable, syncs on reconnect
              </span>

            </div>


            <div className="panel-body">

              <FieldReportForm
                districts={districts}
              />

            </div>


          </div>

        )}


      </main>

    </div>

  );

}