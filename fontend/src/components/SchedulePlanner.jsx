import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const defaultSubject = () => ({
  id: Date.now(),
  name: "",
  difficulty: 3,
  urgency: 3,
  hours_needed: 4,
  deadline: "",
});

export default function SchedulePlanner() {
  const [subjects, setSubjects] = useState([defaultSubject()]);
  const [availableHours, setAvailableHours] = useState(6);
  const [studyDays, setStudyDays] = useState(7);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addSubject = () => setSubjects([...subjects, defaultSubject()]);
  const removeSubject = (id) => setSubjects(subjects.filter((s) => s.id !== id));
  const updateSubject = (id, field, value) =>
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const handleGenerate = async () => {
    if (subjects.some((s) => !s.name.trim())) {
      setError("Please fill in all subject names.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/api/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: subjects.map(({ id, ...s }) => ({
            ...s,
            difficulty: Number(s.difficulty),
            urgency: Number(s.urgency),
            hours_needed: Number(s.hours_needed),
          })),
          available_hours_per_day: Number(availableHours),
          study_days: Number(studyDays),
        }),
      });
      if (!res.ok) throw new Error("Server error");
      setResult(await res.json());
    } catch {
      setError("Failed to connect to backend. Is it running on port 8000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid-2">
        {/* ── Input Panel ── */}
        <div className="card">
          <p className="card-title">📚 Your Subjects</p>

          {subjects.map((s, i) => (
            <div key={s.id} style={{ marginBottom: 24, paddingBottom: 20, borderBottom: i < subjects.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14 }}>Subject {i + 1}</span>
                {subjects.length > 1 && (
                  <button className="btn btn-danger" onClick={() => removeSubject(s.id)}>Remove</button>
                )}
              </div>

              <div className="form-group">
                <label>Subject Name</label>
                <input placeholder="e.g. Data Structures" value={s.name}
                  onChange={(e) => updateSubject(s.id, "name", e.target.value)} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Difficulty: {s.difficulty}/5</label>
                  <input type="range" min="1" max="5" value={s.difficulty} className="range-input"
                    onChange={(e) => updateSubject(s.id, "difficulty", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Urgency: {s.urgency}/5</label>
                  <input type="range" min="1" max="5" value={s.urgency} className="range-input"
                    onChange={(e) => updateSubject(s.id, "urgency", e.target.value)} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Hours Needed</label>
                  <input type="number" min="1" max="100" value={s.hours_needed}
                    onChange={(e) => updateSubject(s.id, "hours_needed", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Deadline (optional)</label>
                  <input type="date" value={s.deadline}
                    onChange={(e) => updateSubject(s.id, "deadline", e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          <button className="btn btn-secondary" style={{ width: "100%", marginBottom: 16 }} onClick={addSubject}>
            + Add Subject
          </button>

          <div className="divider" />

          <div className="grid-2">
            <div className="form-group">
              <label>Hours/Day Available</label>
              <input type="number" min="1" max="16" value={availableHours}
                onChange={(e) => setAvailableHours(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Study Days</label>
              <input type="number" min="1" max="30" value={studyDays}
                onChange={(e) => setStudyDays(e.target.value)} />
            </div>
          </div>

          {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" style={{ width: "100%" }}
            onClick={handleGenerate} disabled={loading}>
            {loading ? "⏳ Generating..." : "✨ Generate AI Schedule"}
          </button>
        </div>

        {/* ── Output Panel ── */}
        <div className="card">
          <p className="card-title">🏆 Priority Scores</p>
          {loading && (
            <div className="loader">
              <div className="dots"><span /><span /><span /></div>
              AI is building your schedule…
            </div>
          )}
          {!loading && !result && (
            <div className="empty-state">
              <div className="emoji">🤔</div>
              <p>Add your subjects and hit Generate to see AI-powered priority scores and schedule.</p>
            </div>
          )}
          {result && (
            <>
              <div className="priority-list">
                {result.priority_scores?.map((p, i) => (
                  <div className="priority-item" key={i}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{p.subject}</strong>
                      <div className="priority-reason">{p.reason}</div>
                    </div>
                    <div className="priority-score">{Number(p.score).toFixed(1)}</div>
                  </div>
                ))}
              </div>
              {result.summary && (
                <>
                  <div className="divider" />
                  <div className="summary-box">{result.summary}</div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Schedule Days ── */}
      {result?.schedule && (
        <div className="card" style={{ marginTop: 24 }}>
          <p className="card-title">📅 Day-by-Day Schedule</p>
          <div className="schedule-grid">
            {result.schedule.map((day, i) => (
              <div className="day-card" key={i}>
                <div className="day-header">
                  <span className="day-title">{day.date_label}</span>
                  <span className="badge badge-teal">{day.total_hours}h total</span>
                </div>
                <div className="sessions">
                  {day.sessions?.map((s, j) => (
                    <div className="session" key={j}>
                      <div className="session-info">
                        <span className="session-subject">{s.subject}</span>
                        <span className="session-tip">💡 {s.focus_tip}</span>
                      </div>
                      <span className="session-hours">{s.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
