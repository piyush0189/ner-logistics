import { useEffect, useState } from "react";
import { getReports, submitReport } from "../api/client.js";

const QUEUE_KEY = "ner_offline_report_queue";

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export default function FieldReportForm({ districts = [] }) {
  const [reports, setReports] = useState([]);
  const [queued, setQueued] = useState(loadQueue());
  const [online, setOnline] = useState(navigator.onLine);
  const [loadingReports, setLoadingReports] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    officer: "",
    districtId: "",
    note: "",
    severity: "medium",
    lat: "",
    lng: "",
  });

  async function refresh() {
    try {
      setLoadingReports(true);

      const data = await getReports();
      setReports(data.reports || []);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }

  useEffect(() => {
    refresh();

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    async function trySync() {
      if (!online || queued.length === 0) return;

      const remaining = [];

      for (const item of queued) {
        try {
          await submitReport(item);
        } catch {
          remaining.push(item);
        }
      }

      setQueued(remaining);
      saveQueue(remaining);

      refresh();
    }

    trySync();
  }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();

    const district = districts.find(
      (d) => d.id === form.districtId
    );

    const payload = {
      officer: form.officer,
      districtId: form.districtId || null,
      note: form.note,
      severity: form.severity,
      lat: form.lat ? Number(form.lat) : district?.lat,
      lng: form.lng ? Number(form.lng) : district?.lng,
      clientTimestamp: Date.now(),
    };

    setSubmitting(true);

    if (!navigator.onLine) {
      const next = [...queued, payload];

      setQueued(next);
      saveQueue(next);
    } else {
      try {
        await submitReport(payload);
        await refresh();
      } catch {
        const next = [...queued, payload];

        setQueued(next);
        saveQueue(next);
      }
    }

    setForm({
      officer: form.officer,
      districtId: "",
      note: "",
      severity: "medium",
      lat: "",
      lng: "",
    });

    setSubmitting(false);
  }

  return (
    <div className="field-report-layout">

      {/* REPORT FORM */}
      <div className="field-report-form-panel">

        <div className="section-label">
          Submit field report
        </div>

        <div
          className={`report-connection ${
            online ? "online" : "offline"
          }`}
        >
          <span className="report-connection-dot" />

          <div>
            <div className="report-connection-title">
              {online ? "Connected" : "Offline mode"}
            </div>

            <div className="report-connection-sub">
              {online
                ? "Reports will sync with the operations network"
                : "Reports will be stored locally and synced later"}
            </div>
          </div>
        </div>

        <form
          className="form-grid"
          onSubmit={handleSubmit}
        >
          <div>
            <label>Officer name</label>

            <input
              required
              value={form.officer}
              onChange={(e) =>
                setForm({
                  ...form,
                  officer: e.target.value,
                })
              }
              placeholder="e.g. B. Lalramliana"
            />
          </div>

          <div>
            <label>Nearest district</label>

            <select
              value={form.districtId}
              onChange={(e) =>
                setForm({
                  ...form,
                  districtId: e.target.value,
                })
              }
            >
              <option value="">
                Select district
              </option>

              {districts.map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                >
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Severity</label>

            <select
              value={form.severity}
              onChange={(e) =>
                setForm({
                  ...form,
                  severity: e.target.value,
                })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label>Incident notes</label>

            <textarea
              required
              value={form.note}
              onChange={(e) =>
                setForm({
                  ...form,
                  note: e.target.value,
                })
              }
              placeholder="Describe road condition, blockage, or hazard observed…"
            />
          </div>

          <button
            className="btn-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Submitting…"
              : online
              ? "Submit report"
              : "Save offline — will sync"}
          </button>

          {queued.length > 0 && (
            <div className="queued-report">
              <span className="queued-report-count">
                {queued.length}
              </span>

              <div>
                <div className="queued-report-title">
                  Pending synchronization
                </div>

                <div className="queued-report-sub">
                  {queued.length === 1
                    ? "1 report waiting to sync"
                    : `${queued.length} reports waiting to sync`}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* RECENT REPORTS */}
      <div className="field-report-list">

        <div className="section-label">
          Recent field reports
        </div>

        {loadingReports ? (
          <div className="empty-state">
            Loading field reports…
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            No field reports have been submitted yet.
          </div>
        ) : (
          <div className="field-report-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Officer</th>
                  <th>Severity</th>
                  <th>Note</th>
                  <th>When</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="report-officer">
                        {r.officer}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`pill ${
                          r.severity === "high"
                            ? "blocked"
                            : r.severity === "medium"
                            ? "caution"
                            : "open"
                        }`}
                      >
                        {r.severity}
                      </span>
                    </td>

                    <td>
                      <span className="report-note">
                        {r.note}
                      </span>
                    </td>

                    <td>
                      {new Date(
                        r.timestamp
                      ).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}