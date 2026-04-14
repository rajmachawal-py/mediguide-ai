<p align="center">
  <img src="https://img.shields.io/badge/MediGuide_AI-Healthcare_Guidance-0ea5e9?style=for-the-badge&logo=heart-pulse&logoColor=white" alt="MediGuide AI" />
</p>

<h1 align="center">🏥 MediGuide AI</h1>

<p align="center">
  <strong>AI-Powered Multilingual Healthcare Guidance & Hospital Navigation Platform for India</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Sarvam_AI-FF6B35?style=flat-square&logo=soundcloud&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Python_3.11+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white" />
</p>

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Setup</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-project-structure">Structure</a>
</p>

---

## 📋 Overview

MediGuide AI bridges the healthcare accessibility gap in India by providing AI-powered medical guidance that works across languages, literacy levels, and technical expertise. Users can describe symptoms via voice or text in **Hindi**, **Marathi**, or **English**, receive AI-driven triage assessments, find nearby hospitals with real-time GPS, and navigate inside hospital buildings with turn-by-turn indoor directions.

> **Built for Smart India Hackathon (SIH)** — addressing healthcare accessibility in underserved communities across India.

---

## ✨ Key Features

### 🤖 AI-Powered Symptom Triage
Describe symptoms in your language. The AI asks 3–4 targeted follow-up questions, then classifies urgency as **Mild** 🟢 / **Moderate** 🟡 / **Emergency** 🔴 — with actionable next steps and recommended specialties.

### 🎙️ Voice-First Experience
Full voice integration powered by **Sarvam AI**:
- **Speech-to-Text** (`saaras:v3`) — speak symptoms naturally in Hindi, Marathi, or English
- **Text-to-Speech** (`bulbul:v3`) — AI responses read aloud for accessibility
- Supports Hinglish and mixed-language input

### 🏥 Hospital Discovery
Find nearby hospitals using live GPS with:
- Distance calculation (Haversine formula)
- Filter by **specialty** (cardiology, emergency, pediatrics, etc.)
- Filter by **type** (Government / Private / Trust)
- One-tap Google Maps directions, call, and 108 ambulance emergency dial

### 🗺️ Indoor Hospital Navigation
Interactive SVG floor plans with:
- **BFS pathfinding** — shortest route from entrance to any department
- **Multi-floor support** — lift and stairs transitions with floor selector
- **Accessibility mode** — wheelchair-only routes (excludes stairs)
- **Voice-guided directions** — step-by-step instructions via TTS
- **10 hospitals mapped** across Pune & Mumbai with 164+ navigation nodes

### 📋 Doctor-Ready Summary
Generate structured reports for doctor visits:
- Chief complaint, duration, severity scale
- Associated symptoms & medical history
- Formatted for easy printing or sharing

### 🏛️ Government Scheme Matcher
AI-powered eligibility matching for healthcare schemes:
- **Ayushman Bharat (PM-JAY)** — ₹5 lakh coverage
- **MJPJAY** — Maharashtra state scheme
- **Janani Suraksha Yojana** — maternal health
- Explanations in the user's preferred language

### 👨‍👩‍👧 Caregiver Mode
Family health monitoring:
- Link family members as caregivers
- Automatic push notifications when patient completes triage
- Alert history dashboard

### 🔐 Flexible Authentication
- **Email/Password** registration and login
- **Google OAuth** (one-tap sign in)
- **Guest Mode** for instant access without signup

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite 6 + TailwindCSS 3 | SPA with dark glassmorphism UI |
| **Backend** | Python FastAPI | REST API with async support |
| **Database** | Supabase (PostgreSQL) | DB + Auth + RLS + Realtime |
| **AI Engine** | Google Gemini 2.5 Flash Lite | Symptom triage, summaries, scheme matching |
| **Voice** | Sarvam AI (saaras:v3 / bulbul:v3) | Hindi, Marathi, English STT & TTS |
| **Maps** | Google Maps JavaScript API | Hospital discovery, directions |
| **Notifications** | Firebase Cloud Messaging | Caregiver push notifications |
| **Deployment** | Render (API) + Vercel (Frontend) | Production hosting |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User (Mobile / Desktop)              │
│                                                         │
│   ┌──────────┐   ┌──────────┐   ┌───────────────────┐   │
│   │   Voice  │   │   Chat   │   │   Hospital Find   │   │
│   │   Input  │   │  Input   │   │  + Indoor Map     │   │
│   └─────┬────┘   └─────┬────┘   └────────┬──────────┘   │
└─────────┼──────────────┼─────────────────┼──────────────┘
          │              │                 │
          ▼              ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python)              │
│                                                         │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Sarvam AI  │  │  Gemini 2.5  │  │  Navigation     │  │
│  │ STT / TTS  │  │  Flash Lite  │  │  (BFS Router)   │  │
│  │            │  │              │  │                 │  │
│  │ saaras:v3  │  │ • Triage     │  │ • Map Graph     │  │
│  │ bulbul:v3  │  │ • Summary    │  │ • Shortest Path │  │
│  │            │  │ • Schemes    │  │ • Multi-floor   │  │
│  └────────────┘  └──────────────┘  └─────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Supabase (PostgreSQL + Auth)           │   │
│  │                                                  │   │
│  │  • profiles     • hospitals     • departments    │   │
│  │  • indoor_map_nodes / edges    • schemes         │   │
│  │  • caregiver_links  • appointments               │   │
│  │  • Row Level Security (RLS)   • Auth triggers    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Link |
|---|---|---|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Supabase Account | Free tier | [supabase.com](https://supabase.com) |
| Gemini API Key | — | [aistudio.google.com](https://aistudio.google.com/apikey) |
| Sarvam AI Key | — | [docs.sarvam.ai](https://docs.sarvam.ai) |
| Google Maps Key | — | [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) |

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/mediguide-ai.git
cd mediguide-ai
```

### 2️⃣ Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv mediguide-venv
mediguide-venv\Scripts\activate          # Windows
# source mediguide-venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

Create `backend/.env`:
```env
# ── Required ──────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SARVAM_API_KEY=your_sarvam_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_key

# ── Optional (Push Notifications) ─────────────────────────
FCM_CREDENTIALS_JSON=path/to/firebase-credentials.json
```

> **⚠️ Important:** `SUPABASE_SERVICE_KEY` must be the **service_role** key (not anon) for profile writes and caregiver features to work.

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

The app will be available at **http://localhost:5173** 🎉

### 4️⃣ Setup Database

1. Go to **Supabase Dashboard → SQL Editor**
2. Run SQL files in this order:

| Order | File | Description |
|---|---|---|
| 1 | `supabase/schema.sql` | Tables, RLS policies, functions, triggers |
| 2 | `supabase/seed_hospitals.sql` | 10 hospitals (Pune + Mumbai) with departments |
| 3 | `supabase/seed_schemes.sql` | Government healthcare schemes |
| 4 | `supabase/seed_indoor_map.sql` | Indoor navigation for Sassoon Hospital |
| 5 | `supabase/seed_indoor_map_all.sql` | Indoor navigation for remaining 9 hospitals |
| 6 | `supabase/seed_appointments.sql` | Sample appointment data |

### 5️⃣ Configure Authentication

1. **Supabase Dashboard → Authentication → Providers**
2. Enable **Email** provider (email/password login)
3. Enable **Google** provider:
   - Add Google OAuth Client ID & Secret
   - Set redirect URL: `http://localhost:5173/login`

---

## 🌍 Supported Languages

| Language | Code | Script | Voice (STT + TTS) | AI Chat |
|---|---|---|---|---|
| 🇮🇳 Hindi | `hi` | देवनागरी | ✅ Sarvam AI | ✅ Gemini |
| 🇮🇳 Marathi | `mr` | देवनागरी | ✅ Sarvam AI | ✅ Gemini |
| 🇬🇧 English | `en` | Latin | ✅ Sarvam AI | ✅ Gemini |

> Mixed-language input (Hinglish, Marathlish) is automatically detected and supported.

---

## 📡 API Reference

### Triage & Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/triage` | AI symptom triage with urgency classification |
| `POST` | `/api/chat` | General health Q&A chat |
| `POST` | `/api/chat/summary` | Generate doctor-ready symptom summary |

### Voice

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/voice/stt` | Speech-to-Text (upload audio file) |
| `POST` | `/api/voice/tts` | Text-to-Speech (returns audio) |

### Hospitals

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hospitals/nearby?lat=&lng=&radius_km=` | Find nearby hospitals by GPS |
| `GET` | `/api/hospitals/:id` | Hospital details |
| `GET` | `/api/hospitals/:id/departments` | List departments |

### Indoor Navigation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/navigation/:id/map` | Indoor map graph (nodes + edges) |
| `GET` | `/api/navigation/:id/route?from=&to=&accessible=` | BFS shortest path |

### Government Schemes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/schemes/eligible` | Eligible schemes for user |
| `GET` | `/api/schemes/:id/explain` | AI-powered scheme explanation |

### Profile & Caregiver

| Method | Endpoint | Description |
|---|---|---|
| `GET/PUT` | `/api/profile` | User profile management |
| `POST` | `/api/profile/fcm` | Save Firebase push token |
| `POST` | `/api/caregiver/link` | Link a caregiver |
| `GET` | `/api/caregiver/links` | Get caregiver links |
| `POST` | `/api/caregiver/notify` | Send caregiver notification |
| `GET` | `/api/caregiver/alerts` | Alert history |

---

## 📁 Project Structure

```
mediguide-ai/
├── backend/
│   ├── main.py                        # FastAPI entry point + CORS
│   ├── requirements.txt               # Python dependencies
│   ├── .env                           # API keys (git-ignored)
│   └── app/
│       ├── config.py                  # Pydantic settings loader
│       ├── db/
│       │   └── supabase_client.py     # Supabase client singleton
│       ├── models/                    # Pydantic schemas
│       │   ├── chat_models.py         # Triage, chat, summary models
│       │   ├── hospital_models.py     # Hospital, department models
│       │   └── user_models.py         # Profile models
│       ├── routers/                   # API route handlers
│       │   ├── triage.py              # POST /api/triage
│       │   ├── chat.py                # POST /api/chat + /summary
│       │   ├── voice.py               # POST /api/voice/stt, /tts
│       │   ├── hospital.py            # GET /api/hospitals/*
│       │   ├── navigation.py          # GET /api/navigation/*
│       │   ├── profile.py             # GET/PUT /api/profile
│       │   ├── schemes.py             # GET /api/schemes/*
│       │   └── caregiver.py           # POST /api/caregiver/*
│       ├── services/                  # Business logic
│       │   ├── gemini_service.py      # Google Gemini AI integration
│       │   ├── sarvam_service.py      # Sarvam AI (STT + TTS)
│       │   ├── triage_service.py      # Rule-based urgency classifier
│       │   ├── hospital_service.py    # Hospital discovery (Haversine)
│       │   ├── navigation_service.py  # Indoor BFS pathfinding
│       │   ├── scheme_service.py      # Scheme matching logic
│       │   ├── caregiver_service.py   # Caregiver link management
│       │   └── fcm_service.py         # Firebase push notifications
│       └── prompts/                   # AI prompt templates
│           ├── triage_prompt.txt      # Symptom triage system prompt
│           ├── summary_prompt.txt     # Doctor-ready summary prompt
│           ├── scheme_prompt.txt      # Scheme explanation prompt
│           └── system_prompt.txt      # General health Q&A prompt
│
├── frontend/
│   ├── index.html                     # HTML entry point
│   ├── package.json                   # Node dependencies
│   ├── vite.config.js                 # Vite + API proxy config
│   ├── tailwind.config.js             # Design system tokens
│   ├── .env.local                     # Frontend env vars (git-ignored)
│   └── src/
│       ├── App.jsx                    # React Router setup
│       ├── main.jsx                   # React entry point
│       ├── index.css                  # Global styles + design system
│       ├── pages/
│       │   ├── LoginPage.jsx          # Email/Google/Guest login
│       │   ├── ChatPage.jsx           # AI triage chat interface
│       │   ├── HospitalPage.jsx       # Nearby hospitals (list + map)
│       │   ├── IndoorMapPage.jsx      # Indoor hospital navigation
│       │   ├── ProfilePage.jsx        # User profile management
│       │   └── CaregiverDashboard.jsx # Caregiver alerts dashboard
│       ├── components/
│       │   ├── chat/                  # ChatBubble, ChatInput, VoiceButton
│       │   ├── hospital/             # HospitalCard
│       │   ├── map/                   # SVGFloorPlan, FloorSelector, RouteOverlay
│       │   └── shared/               # Navbar, Spinner, ProtectedRoute
│       ├── hooks/
│       │   ├── useChat.js             # Chat state management
│       │   └── useGeolocation.js      # Browser GPS wrapper
│       ├── services/
│       │   ├── api.js                 # Axios API client
│       │   ├── supabase.js            # Supabase auth client
│       │   ├── sarvam.js              # Audio playback utilities
│       │   └── mapsHelper.js          # Google Maps URL helpers
│       └── utils/
│           ├── formatters.js          # Distance, date formatters
│           └── languageDetect.js      # Script-based language detection
│
└── supabase/
    ├── schema.sql                     # Full DB schema + RLS + functions
    ├── seed_hospitals.sql             # 10 hospitals (Pune + Mumbai)
    ├── seed_schemes.sql               # Government healthcare schemes
    ├── seed_indoor_map.sql            # Indoor map: Sassoon Hospital
    ├── seed_indoor_map_all.sql        # Indoor maps: 9 remaining hospitals
    └── seed_appointments.sql          # Sample appointment data
```

---

## 🏥 Seeded Hospitals

The platform comes pre-loaded with 10 real hospitals across Pune and Mumbai:

| # | Hospital | City | Type | Departments | Indoor Map |
|---|---|---|---|---|---|
| 1 | Sassoon General Hospital | Pune | Government | 8 | ✅ 2 floors |
| 2 | KEM Hospital Pune | Pune | Government | 7 | ✅ 4 floors |
| 3 | Ruby Hall Clinic | Pune | Private | 7 | ✅ 4 floors |
| 4 | Jehangir Hospital | Pune | Private | 6 | ✅ 4 floors |
| 5 | Aundh District Hospital | Pune | Government | 3 | ✅ 2 floors |
| 6 | KEM Hospital Mumbai | Mumbai | Government | 6 | ✅ 4 floors |
| 7 | Nair Hospital | Mumbai | Government | 4 | ✅ 4 floors |
| 8 | Lilavati Hospital | Mumbai | Private | 5 | ✅ 4 floors |
| 9 | Bombay Hospital | Mumbai | Trust | 5 | ✅ 4 floors |
| 10 | Wockhardt Hospital | Mumbai | Private | 4 | ✅ 3 floors |

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_KEY` | ✅ | Supabase anon (public) key |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service_role key (for DB writes) |
| `SARVAM_API_KEY` | ✅ | Sarvam AI API key |
| `GOOGLE_MAPS_API_KEY` | ✅ | Google Maps JavaScript API key |
| `FCM_CREDENTIALS_JSON` | ❌ | Firebase service account JSON path |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `VITE_GOOGLE_MAPS_API_KEY` | ✅ | Google Maps API key |

---

## 🧪 Running in Development

```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies API calls to `localhost:8000`.

---

## 👥 Team

Built by **Team MediGuide** for **Smart India Hackathon (SIH)**.

---

## 📄 License

This project is built for educational and hackathon purposes. All hospital data is for demonstration only and does not represent real-time availability.

---

<p align="center">
  Made with ❤️ for accessible healthcare in India
</p>
