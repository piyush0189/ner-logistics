const NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "▦",
  },
  {
    id: "districts",
    label: "Districts",
    icon: "⌖",
  },
  {
    id: "vehicles",
    label: "Shipments",
    icon: "▣",
  },
  {
    id: "reports",
    label: "Field Reports",
    icon: "✎",
  },
];

export default function Sidebar({ view, setView }) {
  return (
    <nav className="sidebar">

      <div className="sidebar-section">

        <div className="sidebar-label">
          OPERATIONS
        </div>

        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${
              view === item.id ? "active" : ""
            }`}
            onClick={() => setView(item.id)}
          >
            <span className="nav-icon">
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>
          </button>
        ))}

      </div>


      <div className="sidebar-footer">

        <div className="system-status">

          <span className="status-indicator" />

          <div>
            <div className="status-title">
              System operational
            </div>

            <div className="status-sub">
              Monitoring NER network
            </div>
          </div>

        </div>


        <div className="version">
          PRAYAAN · v1.0
        </div>

      </div>

    </nav>
  );
}