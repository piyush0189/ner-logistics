export default function VehicleTracker({ vehicles = [] }) {
  if (!vehicles.length) {
    return (
      <div className="empty-state">
        No active shipments are currently being tracked.
      </div>
    );
  }

  return (
    <div className="shipment-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Cargo</th>
            <th>Route</th>
            <th>Road status</th>
            <th>ETA</th>
            <th>State</th>
          </tr>
        </thead>

        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td>
                <span className="vehicle-id">
                  {v.id}
                </span>
              </td>

              <td>
                {v.cargo}
              </td>

              <td>
                <span className="shipment-route">
                  {v.originName} → {v.destName}
                </span>
              </td>

              <td>
                <span
                  className={`pill ${
                    v.currentRoadStatus || ""
                  }`}
                >
                  {v.currentRoadStatus || "unknown"}
                </span>
              </td>

              <td>
                {v.etaMin != null
                  ? `${v.etaMin} min`
                  : "—"}
              </td>

              <td>
                {v.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}