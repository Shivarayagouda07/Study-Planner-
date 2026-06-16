from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import anthropic
import json
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = FastAPI(title="AI Study Planner API", version="1.0.0")

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ─── Models ───────────────────────────────────────────────

class Subject(BaseModel):
    name: str
    difficulty: int        # 1-5
    urgency: int           # 1-5
    hours_needed: float
    deadline: Optional[str] = None

class ScheduleRequest(BaseModel):
    subjects: List[Subject]
    available_hours_per_day: float
    study_days: int

class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = []

class MissedTask(BaseModel):
    subject: str
    planned_hours: float
    completed_hours: float
    date: str

class RecommendationRequest(BaseModel):
    missed_tasks: List[MissedTask]
    upcoming_subjects: List[Subject]

# ─── Health Check ─────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "AI Study Planner API is running 🚀"}

# ─── 1. Auto-Generate Study Schedule ──────────────────────

@app.post("/api/schedule")
async def generate_schedule(req: ScheduleRequest):
    subjects_info = "\n".join([
        f"- {s.name}: difficulty={s.difficulty}/5, urgency={s.urgency}/5, "
        f"hours needed={s.hours_needed}h, deadline={s.deadline or 'none'}"
        for s in req.subjects
    ])

    prompt = f"""You are an expert academic study planner AI.

A student has the following subjects to study:
{subjects_info}

Available study time: {req.available_hours_per_day} hours/day over {req.study_days} days.

Generate an optimized day-by-day study schedule. Use priority scoring based on difficulty × urgency.
Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{{
  "priority_scores": [{{"subject": "...", "score": 0.0, "reason": "..."}}],
  "schedule": [
    {{
      "day": 1,
      "date_label": "Day 1",
      "sessions": [{{"subject": "...", "hours": 0.0, "focus_tip": "..."}}],
      "total_hours": 0.0
    }}
  ],
  "summary": "..."
}}"""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned malformed JSON. Try again.")

# ─── 2. Chat Study Assistant ──────────────────────────────

@app.post("/api/chat")
async def chat_assistant(req: ChatMessage):
    system_prompt = """You are a friendly, motivating AI study assistant for university students.
You help with study strategies, time management, subject explanations, stress management, and exam tips.
Keep responses concise (under 150 words), warm, and actionable. Use bullet points when listing steps.
Avoid generic advice — be specific and practical."""

    messages = req.history + [{"role": "user", "content": req.message}]

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=400,
        system=system_prompt,
        messages=messages
    )

    return {"reply": response.content[0].text, "role": "assistant"}

# ─── 3. Smart Recommendations for Missed Tasks ────────────

@app.post("/api/recommendations")
async def get_recommendations(req: RecommendationRequest):
    missed_info = "\n".join([
        f"- {t.subject}: planned {t.planned_hours}h but completed only {t.completed_hours}h on {t.date}"
        for t in req.missed_tasks
    ])

    upcoming_info = "\n".join([
        f"- {s.name}: difficulty={s.difficulty}/5, urgency={s.urgency}/5, deadline={s.deadline or 'none'}"
        for s in req.upcoming_subjects
    ])

    prompt = f"""A student has missed some study sessions:
{missed_info}

Upcoming subjects:
{upcoming_info}

Provide adaptive recommendations to recover from the missed tasks while keeping upcoming subjects on track.
Return ONLY valid JSON (no markdown):
{{
  "recovery_plan": [{{"subject": "...", "action": "...", "extra_hours": 0.0, "priority": "high/medium/low"}}],
  "motivational_message": "...",
  "weekly_adjustment": "...",
  "risk_subjects": ["..."]
}}"""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned malformed JSON. Try again.")
