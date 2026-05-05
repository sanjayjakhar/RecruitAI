import streamlit as st
from groq import Groq
import PyPDF2
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
import io
import time

# ── CONFIG ─────────────────────────────────────────
API_KEY      = "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"
client       = Groq(api_key=API_KEY)
GMAIL        = "ankitkumar925630@gmail.com"
APP_PASSWORD = "vvnotgluuhutvkin"
SCOPES       = ["https://www.googleapis.com/auth/calendar"]

st.set_page_config(page_title="HR AI Agent", page_icon="🤖", layout="wide")

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* { font-family: 'Inter', sans-serif; }

.main { background: #f1f5f9; }

.hero {
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%);
    border-radius: 20px;
    padding: 40px;
    text-align: center;
    margin-bottom: 28px;
    box-shadow: 0 20px 40px rgba(37,99,235,0.3);
}
.hero h1 { color: white; font-size: 36px; font-weight: 700; margin: 0; }
.hero p  { color: #bfdbfe; font-size: 16px; margin: 8px 0 0; }

.step-bar {
    background: white;
    border-radius: 16px;
    padding: 20px 28px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.card {
    background: white;
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    border: 1px solid #e2e8f0;
    animation: fadeIn 0.4s ease;
}
@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }

.candidate-strong {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1px solid #86efac;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
    animation: slideIn 0.3s ease;
}
.candidate-maybe {
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
    border: 1px solid #fcd34d;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
    animation: slideIn 0.3s ease;
}
.candidate-reject {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    border: 1px solid #fca5a5;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
    animation: slideIn 0.3s ease;
}
@keyframes slideIn { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:none; } }

.stat-card {
    background: white;
    border-radius: 14px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    border: 1px solid #e2e8f0;
    transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-2px); }
.stat-num   { font-size: 36px; font-weight: 700; }
.stat-label { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500; }

.rank-badge {
    display: inline-block;
    background: linear-gradient(135deg, #2563eb, #3b82f6);
    color: white;
    border-radius: 50%;
    width: 32px; height: 32px;
    text-align: center; line-height: 32px;
    font-weight: 700; font-size: 14px;
    margin-right: 10px;
}

.score-pill {
    display: inline-block;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
}

.section-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 20px 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.stButton>button {
    background: linear-gradient(135deg, #2563eb, #3b82f6) !important;
    color: white !important;
    border: none !important;
    border-radius: 10px !important;
    padding: 10px 24px !important;
    font-weight: 600 !important;
    font-size: 15px !important;
    transition: all 0.2s !important;
    box-shadow: 0 4px 12px rgba(37,99,235,0.3) !important;
}
.stButton>button:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 16px rgba(37,99,235,0.4) !important;
}

.success-banner {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1px solid #86efac;
    border-radius: 12px;
    padding: 14px 20px;
    margin: 8px 0;
    font-size: 14px;
    color: #166534;
    font-weight: 500;
}
.error-banner {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 12px;
    padding: 14px 20px;
    margin: 8px 0;
    font-size: 14px;
    color: #991b1b;
}

.interview-slot {
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border: 1px solid #93c5fd;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: #1e40af;
    font-weight: 500;
    margin-top: 6px;
    display: inline-block;
}

div[data-testid="stProgress"] > div { border-radius: 10px !important; }
</style>
""", unsafe_allow_html=True)

# ── FUNCTIONS ──────────────────────────────────────
def parse_resume_bytes(pdf_bytes):
    text = ""
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def score_resume(resume_text, job_description):
    prompt = f"""You are an HR expert. Score this resume against the job description.
Job Description: {job_description}
Resume: {resume_text}
Give response in this exact format only:
Name: (candidate full name from resume, if not found write Unknown)
Email: (candidate email from resume, if not found write Not Found)
Score: (0-100 number only)
Verdict: (Strong Fit / Maybe / Reject)
Reason: (1 clear line explanation)"""
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

def parse_result(result, filename=""):
    data = {"name": filename.replace(".pdf","") if filename else "Unknown",
            "email": "Not Found", "score": 0, "verdict": "Reject", "reason": "Could not parse"}
    for line in result.split("\n"):
        line = line.strip()
        if line.startswith("Name:"):
            val = line.replace("Name:","").strip()
            if val: data["name"] = val
        elif line.startswith("Email:"):
            val = line.replace("Email:","").strip()
            if val: data["email"] = val
        elif line.startswith("Score:"):
            try: data["score"] = int(''.join(filter(str.isdigit, line.replace("Score:","").strip()))[:3])
            except: data["score"] = 0
        elif line.startswith("Verdict:"):
            data["verdict"] = line.replace("Verdict:","").strip()
        elif line.startswith("Reason:"):
            data["reason"] = line.replace("Reason:","").strip()
    return data

def generate_email_body(name, role, slot_display):
    prompt = f"""Write a professional interview invitation email.
Candidate: {name}, Role: {role}, Interview: {slot_display}
- Warm and professional
- Mention shortlisted
- Mention date and time clearly
- Ask to confirm availability
- Max 6 lines. Return only body."""
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

def send_email(to_email, name, role, slot_display):
    body = generate_email_body(name, role, slot_display)
    msg  = MIMEMultipart()
    msg["From"]    = GMAIL
    msg["To"]      = to_email
    msg["Subject"] = f"Interview Invitation — {role}"
    msg.attach(MIMEText(body, "plain"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL, APP_PASSWORD)
        server.send_message(msg)
    return body

def get_calendar_service():
    creds = None
    if os.path.exists("token.pickle"):
        with open("token.pickle","rb") as t: creds = pickle.load(t)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow  = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.pickle","wb") as t: pickle.dump(creds, t)
    return build("calendar","v3",credentials=creds)

def schedule_calendar(service, name, email, role, dt_start):
    dt_end = dt_start + timedelta(hours=1)
    event  = {
        "summary": f"Interview — {name} for {role}",
        "start":   {"dateTime": dt_start.isoformat(), "timeZone": "Asia/Kolkata"},
        "end":     {"dateTime": dt_end.isoformat(),   "timeZone": "Asia/Kolkata"},
        "attendees": [{"email": email}, {"email": GMAIL}],
        "reminders": {"useDefault": False, "overrides": [
            {"method":"email","minutes":1440},{"method":"popup","minutes":30}
        ]}
    }
    result = service.events().insert(
        calendarId="primary", body=event, sendUpdates="all"
    ).execute()
    return result.get("htmlLink")

def generate_report(role, shortlisted, rejected, schedule_info):
    now   = datetime.now().strftime("%d %B %Y, %I:%M %p")
    total = len(shortlisted) + len(rejected)
    lines = [
        "=" * 62,
        "        HR AI AGENT — FINAL RECRUITMENT REPORT",
        "=" * 62,
        f"  Generated On  : {now}",
        f"  Role          : {role}",
        f"  Total Scanned : {total}",
        f"  Shortlisted   : {len(shortlisted)}",
        f"  Rejected      : {len(rejected)}",
        "=" * 62,
        "",
        "  SHORTLISTED CANDIDATES",
        "  " + "-" * 58,
    ]
    for rank, c in enumerate(shortlisted, 1):
        lines += [
            f"  Rank #{rank}  |  {c['name']}",
            f"  Email     : {c['email']}",
            f"  Score     : {c['score']}/100  |  {c['verdict']}",
            f"  Reason    : {c['reason']}",
            f"  Interview : {schedule_info.get(c['name'], 'Not scheduled')}",
            "  " + "-" * 58,
        ]
    lines += ["", "  REJECTED CANDIDATES", "  " + "-" * 58]
    if rejected:
        for c in rejected:
            lines += [
                f"  Name   : {c['name']}",
                f"  Email  : {c['email']}",
                f"  Score  : {c['score']}/100  |  {c['verdict']}",
                f"  Reason : {c['reason']}",
                "  " + "-" * 58,
            ]
    else:
        lines.append("  No candidates rejected.")
    lines += ["", "=" * 62, "  ✅ Recruitment Pipeline Completed Successfully!", "=" * 62]
    return "\n".join(lines)

# ── SESSION STATE ──────────────────────────────────
for key, val in {
    "results":[], "shortlisted":[], "rejected":[],
    "schedule":{}, "step":1, "filenames":[]
}.items():
    if key not in st.session_state:
        st.session_state[key] = val

# ── HERO ───────────────────────────────────────────
st.markdown("""
<div class='hero'>
  <h1>🤖 HR AI Agent</h1>
  <p>Automated Recruitment Pipeline — Powered by Groq AI + LLaMA 3.1</p>
</div>
""", unsafe_allow_html=True)

# ── STEP PROGRESS ──────────────────────────────────
step_labels = ["📋 Job Setup","📄 Resumes","🧠 Screening","🏆 Shortlist","📧 Email & Schedule","📊 Report"]
cols = st.columns(len(step_labels))
for i, (col, label) in enumerate(zip(cols, step_labels), 1):
    with col:
        active = i <= st.session_state.step
        bg     = "linear-gradient(135deg,#2563eb,#3b82f6)" if active else "#e2e8f0"
        tc     = "white" if active else "#94a3b8"
        st.markdown(f"""
        <div style='text-align:center;'>
          <div style='width:36px;height:36px;border-radius:50%;background:{bg};
               color:{tc};font-weight:700;font-size:14px;line-height:36px;
               margin:0 auto 6px;box-shadow:{"0 4px 12px rgba(37,99,235,0.3)" if active else "none"};
               transition:all 0.3s;'>{i}</div>
          <div style='font-size:11px;color:{"#2563eb" if active else "#94a3b8"};
               font-weight:{"600" if active else "400"};'>{label}</div>
        </div>""", unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ══════════════════════════════════════════════════
# STEP 1 — JOB SETUP
# ══════════════════════════════════════════════════
if st.session_state.step >= 1:
    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.markdown("<div class='section-title'>📋 Step 1 — Job Setup</div>", unsafe_allow_html=True)

    col1, col2 = st.columns([2,1])
    with col1:
        role = st.text_input("🏷️ Role Title", placeholder="e.g. MERN Stack Developer")
        jd   = st.text_area("📝 Job Description", height=160,
                             placeholder="Enter required skills, experience, responsibilities...")
    with col2:
        min_score      = st.slider("🎯 Minimum Shortlist Score", 0, 100, 60)
        interview_date = st.date_input("📅 Interview Date")
        interview_time = st.time_input("⏰ First Interview Time")
        st.markdown(f"<small style='color:#64748b;'>⚡ Each interview: 2 hour gap automatically</small>", unsafe_allow_html=True)

    if st.button("Save & Continue →"):
        if not role or not jd:
            st.error("⚠️ Please enter Role and Job Description!")
        else:
            st.session_state.role           = role
            st.session_state.jd             = jd
            st.session_state.min_score      = min_score
            st.session_state.interview_date = interview_date
            st.session_state.interview_time = interview_time
            st.session_state.step           = 2
            st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

# ══════════════════════════════════════════════════
# STEP 2 — RESUME UPLOAD
# ══════════════════════════════════════════════════
if st.session_state.step >= 2:
    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.markdown("<div class='section-title'>📄 Step 2 — Upload Resumes</div>", unsafe_allow_html=True)

    uploaded = st.file_uploader(
        "Drop PDF resumes here",
        type=["pdf"],
        accept_multiple_files=True,
        help="Upload one or more resume PDFs from anywhere"
    )

    if uploaded:
        cols = st.columns(min(len(uploaded), 4))
        for i, f in enumerate(uploaded):
            with cols[i % 4]:
                st.markdown(f"""
                <div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;
                     padding:12px;text-align:center;margin-bottom:8px;'>
                  <div style='font-size:24px;'>📄</div>
                  <div style='font-size:12px;font-weight:500;color:#1e40af;margin-top:4px;
                       overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>{f.name}</div>
                </div>""", unsafe_allow_html=True)

        st.success(f"✅ {len(uploaded)} resume(s) ready for screening!")

        if st.button("🚀 Start AI Screening →"):
            st.session_state.uploaded  = uploaded
            st.session_state.filenames = [f.name for f in uploaded]
            st.session_state.step      = 3
            st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

# ══════════════════════════════════════════════════
# STEP 3 — AI SCREENING
# ══════════════════════════════════════════════════
if st.session_state.step >= 3 and not st.session_state.results:
    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.markdown("<div class='section-title'>🧠 Step 3 — AI Screening in Progress...</div>", unsafe_allow_html=True)

    uploaded  = st.session_state.get("uploaded", [])
    filenames = st.session_state.get("filenames", [])
    jd        = st.session_state.get("jd", "")
    min_score = st.session_state.get("min_score", 60)

    progress_bar = st.progress(0)
    status_box   = st.empty()
    results      = []

    for i, f in enumerate(uploaded):
        fname = filenames[i] if i < len(filenames) else f.name
        status_box.markdown(f"""
        <div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;
             padding:14px 18px;font-size:14px;color:#1e40af;font-weight:500;'>
          🔍 Scanning {i+1}/{len(uploaded)}: <b>{fname}</b>
        </div>""", unsafe_allow_html=True)
        try:
            text   = parse_resume_bytes(f.read())
            result = score_resume(text, jd)
            results.append((result, fname))
        except Exception as e:
            results.append((f"Name: Unknown\nEmail: Not Found\nScore: 0\nVerdict: Reject\nReason: Error — {e}", fname))
        progress_bar.progress((i+1) / len(uploaded))
        time.sleep(0.3)

    status_box.markdown("""
    <div style='background:#f0fdf4;border:1px solid #86efac;border-radius:10px;
         padding:14px 18px;font-size:14px;color:#166534;font-weight:500;'>
      ✅ Screening complete!
    </div>""", unsafe_allow_html=True)

    shortlisted, rejected = [], []
    for result_text, fname in results:
        d = parse_result(result_text, fname)
        if d["score"] >= min_score:
            shortlisted.append(d)
        else:
            rejected.append(d)

    shortlisted.sort(key=lambda x: x["score"], reverse=True)
    st.session_state.results     = [r for r, _ in results]
    st.session_state.shortlisted = shortlisted
    st.session_state.rejected    = rejected
    st.session_state.step        = 4
    time.sleep(0.5)
    st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

# ══════════════════════════════════════════════════
# STEP 4 — SHORTLIST
# ══════════════════════════════════════════════════
if st.session_state.step >= 4:
    shortlisted = st.session_state.shortlisted
    rejected    = st.session_state.rejected
    total       = len(shortlisted) + len(rejected)

    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.markdown("<div class='section-title'>🏆 Step 4 — Results</div>", unsafe_allow_html=True)

    # Stats
    c1, c2, c3, c4 = st.columns(4)
    avg = round(sum(c["score"] for c in shortlisted)/len(shortlisted)) if shortlisted else 0
    top = shortlisted[0]["score"] if shortlisted else 0

    c1.markdown(f"<div class='stat-card'><div class='stat-num' style='color:#2563eb;'>{total}</div><div class='stat-label'>📄 Total Scanned</div></div>", unsafe_allow_html=True)
    c2.markdown(f"<div class='stat-card'><div class='stat-num' style='color:#22c55e;'>{len(shortlisted)}</div><div class='stat-label'>✅ Shortlisted</div></div>", unsafe_allow_html=True)
    c3.markdown(f"<div class='stat-card'><div class='stat-num' style='color:#ef4444;'>{len(rejected)}</div><div class='stat-label'>❌ Rejected</div></div>", unsafe_allow_html=True)
    c4.markdown(f"<div class='stat-card'><div class='stat-num' style='color:#f59e0b;'>{top}</div><div class='stat-label'>🏆 Top Score</div></div>", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Shortlisted
    if shortlisted:
        st.markdown("<div class='section-title'>✅ Shortlisted Candidates</div>", unsafe_allow_html=True)
        for rank, c in enumerate(shortlisted, 1):
            css    = "candidate-strong" if c["verdict"]=="Strong Fit" else "candidate-maybe"
            color  = "#166534" if c["verdict"]=="Strong Fit" else "#92400e"
            sbg    = "#dcfce7" if c["verdict"]=="Strong Fit" else "#fef3c7"
            emoji  = "🟢" if c["verdict"]=="Strong Fit" else "🟡"
            st.markdown(f"""
            <div class='{css}'>
              <div style='display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;'>
                <div>
                  <span class='rank-badge'>{rank}</span>
                  <span style='font-size:16px;font-weight:700;color:#1e293b;'>{c['name']}</span>
                </div>
                <span style='background:{sbg};color:{color};padding:4px 14px;border-radius:20px;
                     font-size:13px;font-weight:600;'>{emoji} {c['verdict']}</span>
              </div>
              <div style='margin-top:10px;display:flex;flex-wrap:wrap;gap:16px;font-size:13px;color:#475569;'>
                <span>📧 {c['email']}</span>
                <span>🎯 Score: <b style='color:{color};font-size:15px;'>{c['score']}/100</b></span>
              </div>
              <div style='margin-top:8px;font-size:13px;color:#64748b;'>
                💡 {c['reason']}
              </div>
            </div>""", unsafe_allow_html=True)

    # Rejected
    if rejected:
        st.markdown("<div class='section-title'>❌ Rejected Candidates</div>", unsafe_allow_html=True)
        for c in rejected:
            st.markdown(f"""
            <div class='candidate-reject'>
              <div style='display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;'>
                <span style='font-size:15px;font-weight:700;color:#1e293b;'>🔴 {c['name']}</span>
                <span style='background:#fee2e2;color:#991b1b;padding:4px 14px;
                     border-radius:20px;font-size:13px;font-weight:600;'>
                  Score: {c['score']}/100 — {c['verdict']}
                </span>
              </div>
              <div style='margin-top:8px;font-size:13px;color:#64748b;'>
                📧 {c['email']}<br>
                💡 {c['reason']}
              </div>
            </div>""", unsafe_allow_html=True)

    st.markdown("</div>", unsafe_allow_html=True)

    if shortlisted and st.session_state.step == 4:
        if st.button("📧 Send Emails & Schedule Interviews →"):
            st.session_state.step = 5
            st.rerun()

# ══════════════════════════════════════════════════
# STEP 5 — EMAIL + CALENDAR
# ══════════════════════════════════════════════════
if st.session_state.step >= 5 and not st.session_state.schedule:
    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.markdown("<div class='section-title'>📧 Step 5 — Sending Emails & Scheduling</div>", unsafe_allow_html=True)

    shortlisted = st.session_state.shortlisted
    role        = st.session_state.get("role","")
    i_date      = st.session_state.get("interview_date", datetime.today().date())
    i_time      = st.session_state.get("interview_time", datetime.now().time())
    schedule    = {}

    try:
        cal_service = get_calendar_service()
        st.markdown("<div class='success-banner'>✅ Google Calendar connected!</div>", unsafe_allow_html=True)
    except Exception as e:
        st.warning(f"Calendar: {e}")
        cal_service = None

    progress = st.progress(0)

    for i, c in enumerate(shortlisted):
        # 2 HOUR GAP between each interview
        slot_dt      = datetime.combine(i_date, i_time) + timedelta(hours=i*2)
        slot_display = slot_dt.strftime("%d %B %Y at %I:%M %p")
        schedule[c["name"]] = slot_display

        col1, col2 = st.columns(2)
        with col1:
            if c["email"] and c["email"] != "Not Found":
                try:
                    send_email(c["email"], c["name"], role, slot_display)
                    st.markdown(f"<div class='success-banner'>✅ Email sent → <b>{c['name']}</b><br><small>📅 {slot_display}</small></div>", unsafe_allow_html=True)
                except Exception as e:
                    st.markdown(f"<div class='error-banner'>❌ Email failed for {c['name']}: {e}</div>", unsafe_allow_html=True)
            else:
                st.warning(f"⚠️ No email for {c['name']}")

        with col2:
            if cal_service and c["email"] and c["email"] != "Not Found":
                try:
                    link = schedule_calendar(cal_service, c["name"], c["email"], role, slot_dt)
                    st.markdown(f"<div class='success-banner'>✅ Calendar event → <b>{c['name']}</b><br><small>🔗 <a href='{link}' target='_blank'>View Event</a></small></div>", unsafe_allow_html=True)
                except Exception as e:
                    st.markdown(f"<div class='error-banner'>❌ Calendar error: {e}</div>", unsafe_allow_html=True)

        progress.progress((i+1)/len(shortlisted))
        time.sleep(0.3)

    st.session_state.schedule = schedule
    st.session_state.step     = 6

    if st.button("📊 Generate Final Report →"):
        st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

# ══════════════════════════════════════════════════
# STEP 6 — FINAL REPORT
# ══════════════════════════════════════════════════
if st.session_state.step >= 6:
    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.markdown("<div class='section-title'>📊 Step 6 — Final HR Report</div>", unsafe_allow_html=True)

    shortlisted = st.session_state.shortlisted
    rejected    = st.session_state.rejected
    schedule    = st.session_state.schedule
    role        = st.session_state.get("role","")

    # Schedule summary
    if schedule:
        st.markdown("<div class='section-title' style='font-size:16px;'>📅 Interview Schedule</div>", unsafe_allow_html=True)
        for name, slot in schedule.items():
            st.markdown(f"""
            <div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;
                 padding:12px 16px;margin-bottom:8px;display:flex;
                 justify-content:space-between;align-items:center;'>
              <span style='font-weight:600;color:#1e293b;'>👤 {name}</span>
              <span style='color:#2563eb;font-weight:500;font-size:13px;'>📅 {slot}</span>
            </div>""", unsafe_allow_html=True)

    # Full report
    report = generate_report(role, shortlisted, rejected, schedule)
    st.markdown("<br>", unsafe_allow_html=True)
    st.code(report, language="")

    col1, col2 = st.columns(2)
    with col1:
        st.download_button(
            "⬇️ Download Report (.txt)",
            data=report,
            file_name=f"HR_Report_{role.replace(' ','_')}_{datetime.now().strftime('%Y%m%d_%H%M')}.txt",
            mime="text/plain",
            use_container_width=True
        )
    with col2:
        if st.button("🔄 Start New Pipeline", use_container_width=True):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)