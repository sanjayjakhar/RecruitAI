# 🤖 AI-Powered Recruitment Agent (RecruitAI)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-hr--agent--rho.vercel.app-FF6B35?style=for-the-badge&logo=vercel&logoColor=white)](https://hr-agent-rho.vercel.app)
[![Vercel Status](https://img.shields.io/badge/Deployment-Live%20%26%20Active-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://hr-agent-rho.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Groq%20%7C%20PostgreSQL-6366F1?style=for-the-badge)](https://github.com/sanjayjakhar/RecruitAI)

> 🌐 **Live Demo Website:** [https://hr-agent-rho.vercel.app](https://hr-agent-rho.vercel.app)  
> 🔗 **Direct Vercel Domain:** [https://hr-agent-d7m3c68z6-sanjayjakhars-projects.vercel.app](https://hr-agent-d7m3c68z6-sanjayjakhars-projects.vercel.app)

A full-stack, AI-powered hiring platform that automates resume screening, candidate evaluation, interview scheduling, and recruitment reporting. Built with a modern 2026 SaaS aesthetic featuring vibrant light-orange sunset accents, multi-color category badges, ambient aurora mesh gradients, and interactive micro-animations.

---

## 🛠️ Tech Stack

- **Frontend & Full-Stack Framework**: React.js, Next.js (App Router, Pure JavaScript)
- **Styling & UI**: TailwindCSS, Modern Glassmorphism, Ambient Aurora Mesh, Framer Motion
- **AI Engine**: Groq LLM API (`llama-3.3-70b-versatile` / `llama3-70b-8192`)
- **Database & Storage**: PostgreSQL (Neon Serverless) via `@neondatabase/serverless`
- **Resume Parsing**: `pdf-parse` (Automated PDF text extraction & structuring)
- **Email Dispatch**: Nodemailer (Automated interview invitations & status alerts)
- **Report Generation**: `jspdf` & `jspdf-autotable` (Professional PDF candidate dossiers)
- **Python App (Alternative UI)**: Streamlit, Google Calendar API, Google OAuth2

---

## 🎨 Design System & Color Palette

The interface combines a sleek midnight navy foundation with high-energy multi-color accents:

- **Sunset Tangerine / Light Orange (`#FF6B35` → `#FF8A3D` → `#FFA94D`)**: Primary action buttons (`+ New Position`, `Download PDF Report`, `Top N`), pending status badges, best-fit role indicators.
- **Electric Cyan (`#06B6D4` → `#38BDF8`)**: Total applicants pill, resume parsing indicator.
- **Neon Purple / Violet (`#6366F1` → `#8B5CF6`)**: Candidates view badge, analyzed metric card, interview indicators.
- **Mint Emerald (`#10B981` → `#34D399`)**: Shortlisted candidates pill, high-match scores (80-100), jsPDF dossier tag.
- **Deep Midnight Obsidian (`#021024` → `#052659`)**: Header summary cards, dark mode canvas, contrast anchor.

---

## ✨ Key Features

1. **Job Position Management**:
   - Create custom job listings with specific requirements, experience levels, and skill tags.
   - Interactive cards with applicant counts and quick management.
2. **AI Resume Screening & Ranking**:
   - Drag-and-drop batch PDF resume upload.
   - Groq AI extracts skills, experience, education, strengths, gaps, fit score (0-100), and best-fit role.
   - Dynamic ranking (🥇, 🥈, 🥉) with score progress indicators.
3. **Automated Candidate Engagement**:
   - 1-click batch interview scheduling.
   - Nodemailer automated email delivery with customizable templates.
4. **Final Hiring Dossier**:
   - Live KPI overview (Total, Analyzed, Shortlisted, Interviews, Emails, Average Score).
   - Export official styled PDF dossiers using jsPDF.
   - CSV export for HR spreadsheets.
5. **Theme Customization**:
   - Dark / Light mode toggle with aurora background lighting.
   - Accent color personalization (Sunset Orange, Electric Violet, Ocean Navy, Mint Emerald).

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon or local)
- Groq API Key

### 2. Environment Setup
Create a `.env.local` file in the project root:
```env
# Groq LLM API
GROQ_API_KEY=your_groq_api_key_here

# PostgreSQL Database (Neon)
DATABASE_URL=postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require

# Nodemailer Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=RecruitAI <your_email@gmail.com>
```

### 3. Installation & Run
```bash
# Install dependencies
npm install

# Initialize PostgreSQL schema
# Visit http://localhost:3000/api/init-db once to create tables

# Run Next.js Development Server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🧪 Production Build Verification
```bash
npx next build
```
Built with Next.js Turbopack — all 11 static and dynamic routes compile cleanly with zero errors.
