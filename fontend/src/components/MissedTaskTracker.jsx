import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const defaultMissed = () => ({ id: Date.now(), subject: "", planned_hours: 2, completed_hours: 0, date: new Date().toISOString().split("T")[0] });
const defaultUpcoming = () => ({ id: Date.now() + 1, name: "", difficulty: 3, urgency: 3, hours_needed: 4, deadline: "" });

export default function MissedTaskTracker() {
  const [missed, setMissed] = useState([defaultMissed()]);
  const [upcoming, setUpcoming] = useState([defaultUpcoming()]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateMissed = (id, f, v) => setMissed(missed.map((m) => m.id === id ? { ...m, [f]: v } : m));
  const updateUpcoming = (id, f, v) => setUpcoming(upcoming.map((u) => u.id === id ? { ...u, [f]: v } : u));

  const handleAnalyze = async () => {
    if (missed.some((m) => !m.subject.trim()) || upcoming.some((u) => !u.name.trim())) {
      setError("Please fill in all subject names.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missed_tasks: missed.map(({ id, ...m }) => ({ ...m, planned_hours: Number(m.planned_hours), completed_hours: Number(m.completed_hours) })),
          upcoming_subjects: upcoming.map(({ id, ...u }) => ({ ...u, difficulty: Number(u.difficulty), urgency: Number(u.urgency), hours_needed: Number(u.hours_needed) })),
        }),
      });
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setError("Backend not reachable. Check it is running.");
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = (p) => p === "high" ? "badge-red" : p === "medium" ? "badge-orange" : "badge-teal";

  return (
    <div>
      <div className="grid-2">
        {/* Missed Tasks */}
        <div className="card">
          <p className="card-title">❌ Missed / Incomplete Tasks</p>
          {missed.map((m, i) => (
            <div key={m.id} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: i < missed.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Task {i + 1}</span>
                {missed.length > 1 && <button className="btn btn-danger" onClick={() => setMissed(missed.filter((x) => x.id !== m.id))}>Remove</button>}
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input placeholder="e.g. Mathematics" value={m.subject} onChange={(e) => updateMissed(m.id, "subject", e.target.value)} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Planned Hours</label>
                  <input type="number" min="0" max="24" value={m.planned_hours} onChange={(e) => updateMissed(m.id, "planned_hours", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Completed Hours</label>
                  <input type="number" min="0" max="24" value={m.completed_hours} onChange={(e) => updateMissed(m.id, "completed_hours", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={m.date} onChange={(e) => updateMissed(m.id, "date", e.target.value)} />
              </div>
            </div>
          ))}
          <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setMissed([...missed, defaultMissed()])}>
            + Add Missed Task
          </button>
        </div>

        {/* Upcoming Subjects */}
        <div className="card">
          <p className="card-title">📚 Upcoming Subjects</p>
          {upcoming.map((u, i) => (
            <div key={u.id} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: i < upcoming.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Subject {i + 1}</span>
                {upcoming.length > 1 && <button className="btn btn-danger" onClick={() => setUpcoming(upcoming.filter((x) => x.id !== u.id))}>Remove</button>}
              </div>
              <div className="form-group">
                <label>Subject Name</label>
                <input placeholder="e.g. Physics" value={u.name} onChange={(e) => updateUpcoming(u.id, "name", e.target.value)} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Difficulty: {u.difficulty}/5</label>
                  <input type="range" min="1" max="5" value={u.difficulty} className="range-input" onChange={(e) => updateUpcoming(u.id, "difficulty", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Urgency: {u.urgency}/5</label>
                  <input type="range" min="1" max="5" value={u.urgency} className="range-input" onChange={(e) => updateUpcoming(u.id, "urgency", e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Hours Needed</label>
                  <input type="number" min="1" value={u.hours_needed} onChange={(e) => updateUpcoming(u.id, "hours_needed", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input type="date" value={u.deadline} onChange={(e) => updateUpcoming(u.id, "deadline", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setUpcoming([...upcoming, defaultUpcoming()])}>
            + Add Subject
          </button>
        </div>
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 12 }}>{error}</p>}

      <button className="btn btn-primary" style={{ marginTop: 20, width: "100%", padding: "14px" }}
        onClick={handleAnalyze} disabled={loading}>
        {loading ? "⏳ Analyzing..." : "🔁 Get AI Recovery Plan"}
      </button>

      {/* Results */}
      {result && (
        <div style={{ marginTop: 28 }}>
          {result.motivational_message && (
            <div className="motivational" style={{ marginBottom: 20 }}>
              ✨ {result.motivational_message}
            </div>
          )}

          {result.risk_subjects?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <p className="card-title">⚠️ At-Risk Subjects</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {result.risk_subjects.map((s, i) => (
                  <span key={i} className="badge badge-red">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <p className="card-title">🔁 Recovery Plan</p>
            <div className="recovery-grid">
              {result.recovery_plan?.map((r, i) => (
                <div className="recovery-item" key={i}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <strong style={{ fontSize: 15 }}>{r.subject}</strong>
                      <span className={`badge ${priorityColor(r.priority)}`}>{r.priority} priority</span>
                    </div>
                    <div className="recovery-action">{r.action}</div>
                  </div>
                  <div>
                    <div className="extra-hours">+{r.extra_hours}h</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", textAlign: "right" }}>extra needed</div>
                  </div>
                </div>
              ))}
            </div>

            {result.weekly_adjustment && (
              <>
                <div className="divider" />
                <div className="summary-box">📋 {result.weekly_adjustment}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
