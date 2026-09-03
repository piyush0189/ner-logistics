import { useState } from "react";
import { getOptimalRoute } from "../api/client.js";

export default function DistrictPanel({ districts = [], onRoute }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleFindRoute() {
    if (!from || !to || from === to) return;

    setLoading(true);

    try {
      const result = await getOptimalRoute(from, to);
      setRoute(result);

      if (onRoute) {
        onRoute(
          result.found
            ? result.segments.map((s) => s.roadId)
            : []
        );
      }
    } catch (error) {
      setRoute({
        found: false,
        reason: "Unable to calculate the route. Please try again.",
      });

      if (onRoute) onRoute([]);
    } finally {
      setLoading(false);
    }
  }

  const sameDistrict = from && to && from === to;

  return (
    <div className="district-panel">

      {/* ROUTE PLANNER */}
      <div className="section-label">
        AI route planner
      </div>

      <div className="route-tool">

        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Origin district"
        >
          <option value="">Origin</option>

          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="Destination district"
        >
          <option value="">Destination</option>

          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <button
          className="btn-primary"
          onClick={handleFindRoute}
          disabled={loading || !from || !to || sameDistrict}
        >
          {loading ? "Calculating…" : "Suggest route"}
        </button>

      </div>

      {sameDistrict && (
        <div className="route-validation">
          Origin and destination must be different districts.
        </div>
      )}

      {/* ROUTE RESULT */}
      {route && (
        <div className="route-result">

          {route.found ? (
            <div className="alert-item route-success">

              <div className="route-result-header">
                <span className="route-result-title">
                  Recommended route
                </span>

                <span className="route-result-badge">
                  AI SUGGESTED
                </span>
              </div>

              <div className="route-metrics">

                <div className="route-metric">
                  <span className="route-metric-label">
                    Distance
                  </span>

                  <span className="route-metric-value">
                    {route.totalKm} km
                  </span>
                </div>

                <div className="route-metric">
                  <span className="route-metric-label">
                    Avg. risk
                  </span>

                  <span className="route-metric-value">
                    {route.avgRisk}/100
                  </span>
                </div>

                <div className="route-metric">
                  <span className="route-metric-label">
                    Extra delay
                  </span>

                  <span className="route-metric-value">
                    {route.estimatedExtraDelayMin} min
                  </span>
                </div>

              </div>

              <div className="alert-meta route-segments">
                {route.segments
                  .map((s) => s.name)
                  .join(" → ")}
              </div>

            </div>
          ) : (
            <div className="alert-item critical">
              {route.reason}
            </div>
          )}

        </div>
      )}

      {/* DISTRICT TABLE */}
      <div className="section-label">
        District-wise connectivity
      </div>

      {!districts.length ? (
        <div className="empty-state">
          No district connectivity data available.
        </div>
      ) : (
        <div className="district-table-wrap">
          <table>
            <thead>
              <tr>
                <th>District</th>
                <th>State</th>
                <th>Weather</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {districts.map((d) => (
                <tr key={d.id}>

                  <td>
                    <span className="district-name">
                      {d.name}
                    </span>
                  </td>

                  <td>
                    {d.state}
                  </td>

                  <td>
                    {d.weatherSeverity != null
                      ? `${d.weatherSeverity}/100`
                      : "—"}
                  </td>

                  <td>
                    <span
                      className={`pill ${
                        d.connectivity || ""
                      }`}
                    >
                      {d.connectivity || "unknown"}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}