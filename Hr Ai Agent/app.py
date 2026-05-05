from groq import Groq
import PyPDF2
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle

# ── API KEYS ──────────────────────────────────────
API_KEY = "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"
client = Groq(api_key=API_KEY)

GMAIL        = "ankitkumar925630@gmail.com"
APP_PASSWORD = "vvnotgluuhutvkin"
SCOPES       = ["https://www.googleapis.com/auth/calendar"]

# ── GOOGLE CALENDAR AUTH ───────────────────────────
def get_calendar_service():
    creds = None
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)
    return build("calendar", "v3", credentials=creds)

# ── RESUME PARSER ──────────────────────────────────
def parse_resume(pdf_path):
    text = ""
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text()
    return text

# ── AI SCORER ─────────────────────────────────────
def score_resume(resume_text, job_description):
    prompt = f"""
    You are an HR expert. Score this resume against the job description.

    Job Description:
    {job_description}

    Resume:
    {resume_text}

    Give response in this exact format only:
    Name: (candidate name from resume)
    Email: (candidate email from resume)
    Score: (0-100)
    Verdict: (Strong Fit / Maybe / Reject)
    Reason: (1 line explanation)
    """
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

# ── RESULT PARSER ──────────────────────────────────
def parse_result(result):
    data = {"name": "", "email": "", "score": 0, "verdict": "", "reason": ""}
    for line in result.split("\n"):
        if line.startswith("Name:"):
            data["name"] = line.replace("Name:", "").strip()
        elif line.startswith("Email:"):
            data["email"] = line.replace("Email:", "").strip()
        elif line.startswith("Score:"):
            try:
                data["score"] = int(line.replace("Score:", "").strip())
            except:
                data["score"] = 0
        elif line.startswith("Verdict:"):
            data["verdict"] = line.replace("Verdict:", "").strip()
        elif line.startswith("Reason:"):
            data["reason"] = line.replace("Reason:", "").strip()
    return data

# ── EMAIL GENERATOR ────────────────────────────────
def generate_email(name, role, interview_date, interview_time):
    prompt = f"""
    Write a professional interview invitation email for:
    Candidate Name: {name}
    Role: {role}
    Interview Date: {interview_date}
    Interview Time: {interview_time}

    Email should be:
    - Warm and professional
    - Mention they are shortlisted
    - Clearly mention date and time
    - Ask them to confirm availability
    - Short — max 6 lines

    Return only email body — no subject line.
    """
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

# ── EMAIL SENDER ───────────────────────────────────
def send_email(to_email, candidate_name, role, interview_date, interview_time):
    email_body = generate_email(candidate_name, role, interview_date, interview_time)
    msg = MIMEMultipart()
    msg["From"]    = GMAIL
    msg["To"]      = to_email
    msg["Subject"] = f"Interview Invitation — {role}"
    msg.attach(MIMEText(email_body, "plain"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL, APP_PASSWORD)
        server.send_message(msg)
    return email_body

# ── CALENDAR SCHEDULER ─────────────────────────────
def schedule_interview(service, candidate_name, candidate_email,
                        role, interview_date, interview_time):
    start_dt = datetime.strptime(
        f"{interview_date} {interview_time}", "%Y-%m-%d %H:%M"
    )
    end_dt = start_dt + timedelta(hours=1)
    event = {
        "summary": f"Interview — {candidate_name} for {role}",
        "description": f"AI-scheduled interview for {role} position.",
        "start": {"dateTime": start_dt.isoformat(), "timeZone": "Asia/Kolkata"},
        "end":   {"dateTime": end_dt.isoformat(),   "timeZone": "Asia/Kolkata"},
        "attendees": [
            {"email": candidate_email},
            {"email": GMAIL}
        ],
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email",  "minutes": 24 * 60},
                {"method": "popup",  "minutes": 30}
            ]
        }
    }
    event = service.events().insert(
        calendarId="primary", body=event, sendUpdates="all"
    ).execute()
    return event.get("htmlLink")

# ── SHORTLIST ──────────────────────────────────────
def shortlist_candidates(results, min_score=60):
    shortlisted = []
    rejected    = []
    for r in results:
        data = parse_result(r)
        if data["score"] >= min_score:
            shortlisted.append(data)
        else:
            rejected.append(data)
    shortlisted.sort(key=lambda x: x["score"], reverse=True)
    return shortlisted, rejected

# ── FINAL REPORT GENERATOR ─────────────────────────
def generate_report(role, job_description, all_pdfs,
                    shortlisted, rejected, schedule_info):
    now = datetime.now().strftime("%d %B %Y, %I:%M %p")

    lines = []
    lines.append("=" * 60)
    lines.append("           HR AI AGENT — FINAL RECRUITMENT REPORT")
    lines.append("=" * 60)
    lines.append(f"  Generated On  : {now}")
    lines.append(f"  Role          : {role}")
    lines.append(f"  Total Scanned : {len(all_pdfs)}")
    lines.append(f"  Shortlisted   : {len(shortlisted)}")
    lines.append(f"  Rejected      : {len(rejected)}")
    lines.append("=" * 60)

    lines.append("\n  JOB DESCRIPTION")
    lines.append("  " + "-" * 56)
    for l in job_description.split("\n"):
        lines.append(f"  {l}")

    lines.append("\n" + "=" * 60)
    lines.append("  SHORTLISTED CANDIDATES")
    lines.append("=" * 60)
    if not shortlisted:
        lines.append("  No candidates shortlisted.")
    else:
        for rank, c in enumerate(shortlisted, 1):
            lines.append(f"\n  Rank #{rank}")
            lines.append(f"  Name    : {c['name']}")
            lines.append(f"  Email   : {c['email']}")
            lines.append(f"  Score   : {c['score']}/100")
            lines.append(f"  Verdict : {c['verdict']}")
            lines.append(f"  Reason  : {c['reason']}")
            if c['name'] in schedule_info:
                lines.append(f"  Interview: {schedule_info[c['name']]}")
            lines.append("  " + "-" * 56)

    lines.append("\n" + "=" * 60)
    lines.append("  REJECTED CANDIDATES")
    lines.append("=" * 60)
    if not rejected:
        lines.append("  No candidates rejected.")
    else:
        for c in rejected:
            lines.append(f"\n  Name    : {c['name']}")
            lines.append(f"  Email   : {c['email']}")
            lines.append(f"  Score   : {c['score']}/100")
            lines.append(f"  Verdict : {c['verdict']}")
            lines.append(f"  Reason  : {c['reason']}")
            lines.append("  " + "-" * 56)

    lines.append("\n" + "=" * 60)
    lines.append("  INTERVIEW SCHEDULE SUMMARY")
    lines.append("=" * 60)
    if not schedule_info:
        lines.append("  No interviews scheduled.")
    else:
        for name, slot in schedule_info.items():
            lines.append(f"  {name} — {slot}")

    lines.append("\n" + "=" * 60)
    lines.append("  ✅ Recruitment pipeline completed successfully!")
    lines.append("=" * 60)

    report_text = "\n".join(lines)

    # Save to file
    filename = f"HR_Report_{role.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M')}.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(report_text)

    return report_text, filename

# ══════════════════════════════════════════════════
#                  MAIN PROGRAM
# ══════════════════════════════════════════════════
print("=" * 60)
print("          HR AI AGENT — Recruitment Pipeline")
print("=" * 60)

# Step 1 — Job Description
print("\nEnter Job Description")
print("(Type your JD line by line, then type DONE)")
print("-" * 60)
lines = []
while True:
    line = input()
    if line.strip().upper() == "DONE":
        break
    lines.append(line)
job_description = "\n".join(lines)
role = input("\nEnter Role Name (e.g. Python Developer): ").strip()

# Minimum score
print("\nMinimum shortlist score? (press Enter for default 60):")
min_score_input = input("Score: ").strip()
min_score = int(min_score_input) if min_score_input else 60

# Step 2 — Resume PDFs
print("\nPaste resume PDF paths one by one (type DONE when finished):")
pdf_paths = []
while True:
    path = input(f"  Resume {len(pdf_paths)+1} path (or DONE): ").strip().strip('"')
    if path.upper() == "DONE":
        break
    if path.endswith(".pdf") and os.path.exists(path):
        pdf_paths.append(path)
        print("   ✅ Resume added!")
    else:
        print("   ❌ File not found — try again")

# Step 3 — AI Screening
print(f"\n[Starting AI screening for {len(pdf_paths)} resumes...]\n")
results = []
for i, pdf_path in enumerate(pdf_paths):
    filename = os.path.basename(pdf_path)
    print(f"  Scanning {i+1}/{len(pdf_paths)}: {filename}")
    try:
        resume_text = parse_resume(pdf_path)
        result      = score_resume(resume_text, job_description)
        results.append(result)
        print(f"  ✅ Done!\n")
    except Exception as e:
        print(f"  ❌ Error: {e}\n")

# Step 4 — Shortlist
shortlisted, rejected = shortlist_candidates(results, min_score)

print("=" * 60)
print("          SHORTLISTED CANDIDATES")
print(f"          Minimum Score : {min_score}/100")
print("=" * 60)

if not shortlisted:
    print("  No candidates met the minimum score.")
else:
    for rank, c in enumerate(shortlisted, 1):
        print(f"\n  Rank #{rank}")
        print(f"  Name    : {c['name']}")
        print(f"  Email   : {c['email']}")
        print(f"  Score   : {c['score']}/100")
        print(f"  Verdict : {c['verdict']}")
        print(f"  Reason  : {c['reason']}")
        print("  " + "-" * 56)

# Step 5 & 6 — Email + Calendar
schedule_info = {}

print("\nWould you like to send emails & schedule interviews? (yes/no):")
send = input("Choice: ").strip().lower()

if send in ["yes", "y"] and shortlisted:
    print("\nEnter interview date (format: YYYY-MM-DD, e.g. 2025-05-15):")
    interview_date = input("Date: ").strip()
    print("Enter interview start time (format: HH:MM, e.g. 10:00):")
    interview_time = input("Time: ").strip()

    print("\n[Connecting to Google Calendar...]\n")
    try:
        cal_service = get_calendar_service()
        print("  ✅ Google Calendar connected!\n")
    except Exception as e:
        print(f"  ❌ Calendar connection failed: {e}")
        cal_service = None

    for i, c in enumerate(shortlisted):
        slot_dt = datetime.strptime(
            f"{interview_date} {interview_time}", "%Y-%m-%d %H:%M"
        ) + timedelta(hours=i)
        slot_date    = slot_dt.strftime("%Y-%m-%d")
        slot_time    = slot_dt.strftime("%H:%M")
        slot_display = slot_dt.strftime("%d %B %Y at %I:%M %p")

        schedule_info[c["name"]] = slot_display

        print(f"  Processing : {c['name']}")
        print(f"  Slot       : {slot_display}")

        if c["email"]:
            try:
                send_email(c["email"], c["name"], role, slot_display, slot_time)
                print(f"  ✅ Email sent to {c['email']}")
            except Exception as e:
                print(f"  ❌ Email failed: {e}")
        else:
            print(f"  ⚠️  No email found in resume")

        if cal_service and c["email"]:
            try:
                link = schedule_interview(
                    cal_service, c["name"], c["email"],
                    role, slot_date, slot_time
                )
                print(f"  ✅ Calendar event created!")
                print(f"  🔗 {link}")
            except Exception as e:
                print(f"  ❌ Calendar error: {e}")
        print()

# Step 7 — Final Report
print("\n[Generating Final HR Report...]\n")
report_text, filename = generate_report(
    role, job_description, pdf_paths,
    shortlisted, rejected, schedule_info
)

print(report_text)
print(f"\n  📄 Report saved as: {filename}")
print(f"  📁 Location: C:\\Users\\BIT\\Desktop\\Hr Ai Agent\\{filename}")