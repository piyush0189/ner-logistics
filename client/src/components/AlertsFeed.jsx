function timeAgo(ts) {
  const diffMin = Math.round((Date.now() - ts) / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  return `${Math.round(diffMin / 60)}h ago`;
}

function formatAlertType(type) {
  if (!type) return "Alert";

  return type
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AlertsFeed({ alerts = [] }) {
  if (!alerts.length) {
    return (
      <div className="empty-state">
        No active alerts. All monitored corridors are within normal risk
        thresholds.
      </div>
    );
  }

  return (
    <div className="alerts-feed">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`alert-item ${a.severity || ""}`}
        >
          <div className="alert-content">
            <div className="alert-message">
              {a.message}
            </div>

            <div className="alert-meta">
              <span>{formatAlertType(a.type)}</span>
              <span className="alert-separator">·</span>
              <span>{timeAgo(a.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}