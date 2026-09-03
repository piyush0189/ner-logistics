import { useEffect, useState } from "react";

export default function TopBar({ connected }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="top-bar">

      {/* BRAND */}
      <div className="brand">

        <div className="brand-logo">
          P
        </div>

        <div className="brand-content">
          <div className="brand-mark">
            Prayaan
          </div>

          <div className="brand-sub">
            Logistics Intelligence Platform
          </div>
        </div>

      </div>


      {/* CENTER */}
      <div className="top-bar-center">

        <span>
          NORTH EASTERN REGION
        </span>

        <span className="top-divider">
          |
        </span>

        <span className="operations-text">
          LIVE OPERATIONS
        </span>

      </div>


      {/* RIGHT */}
      <div className="top-bar-right">

        <div
          className={`live-status ${
            connected ? "connected" : "disconnected"
          }`}
        >
          <span className="live-dot" />

          <span>
            {connected ? "Live" : "Offline"}
          </span>
        </div>

        <span className="current-time">
          {now.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </span>

      </div>

    </header>
  );
}