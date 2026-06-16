import { useState } from "react";
import SchedulePlanner from "./components/SchedulePlanner";
import ChatAssistant from "./components/ChatAssistant";
import MissedTaskTracker from "./components/MissedTaskTracker";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("schedule");

  const tabs = [
    { id: "schedule", label: "📅 Schedule", desc: "Generate Study Plan" },
    { id: "chat", label: "🤖 AI Chat", desc: "Study Assistant" },
    { id: "missed", label: "🔁 Recovery", desc: "Missed Task Help" },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🎯</span>
            <div>
              <h1>StudyMind AI</h1>
              <p>Adaptive Study Planner</p>
            </div>
          </div>
          <nav className="nav">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`nav-btn ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="nav-icon">{t.label.split(" ")[0]}</span>
                <span className="nav-text">{t.label.split(" ")[1]}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="tab-header">
          <h2>{tabs.find((t) => t.id === activeTab)?.label}</h2>
          <p>{tabs.find((t) => t.id === activeTab)?.desc}</p>
        </div>

        <div className="content">
          {activeTab === "schedule" && <SchedulePlanner />}
          {activeTab === "chat" && <ChatAssistant />}
          {activeTab === "missed" && <MissedTaskTracker />}
        </div>
      </main>
    </div>
  );
}
