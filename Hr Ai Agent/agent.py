import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
import PyPDF2

# Load environment variables
current_dir = Path(__file__).resolve().parent
load_dotenv(current_dir / ".env")
load_dotenv(current_dir.parent / ".env")
load_dotenv(current_dir.parent / ".env.local")

API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    print("❌ ERROR: GROQ_API_KEY is not set!")
    print("Please set GROQ_API_KEY in Hr Ai Agent/.env")
    exit(1)

client = Groq(api_key=API_KEY)

def parse_resume(pdf_path):
    text = ""
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text

def score_resume(resume_text, job_description):
    prompt = f"""
    You are an HR expert. Score this resume against the job description.
    
    Job Description:
    {job_description}
    
    Resume:
    {resume_text}
    
    Give response in this exact format:
    Score: (0-100)
    Verdict: (Strong Fit / Maybe / Reject)
    Reason: (1 line explanation)
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content


# ---- AAPKA INPUT ----
if __name__ == "__main__":
    print("=" * 40)
    print("   HR AI AGENT - Resume Screener")
    print("=" * 40)

    print("\nJob Description likho")
    print("(likhne ke baad Enter dabao, phir 'DONE' likho aur Enter dabao)")
    print("-" * 40)

    lines = []
    while True:
        line = input()
        if line.strip().upper() == "DONE":
            break
        lines.append(line)

    job_description = "\n".join(lines)

    print("\nJob Description save ho gayi!")

    print("\nPDF path paste karo:")
    pdf_path = input("Path: ").strip().strip('"')

    if not os.path.exists(pdf_path):
        print(f"❌ File not found at: {pdf_path}")
        exit(1)

    print("\nResume padh raha hoon...")
    resume_text = parse_resume(pdf_path)
    print("Resume ready!")

    print("\nScore kar raha hoon...")
    result = score_resume(resume_text, job_description)

    print("\n" + "=" * 40)
    print("         RESULT")
    print("=" * 40)
    print(result)
    print("=" * 40)