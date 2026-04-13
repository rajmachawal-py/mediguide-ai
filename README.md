# 🏥 MediGuide AI

**Multilingual Healthcare Guidance & Hospital Navigation Platform for India**

MediGuide AI is an AI-powered, multilingual healthcare guidance platform that makes basic medical assistance accessible to everyone in India — regardless of language, literacy level, or technical expertise.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Triage** | Describe symptoms in Hindi, Marathi, or English. AI asks 3-4 follow-up questions, then classifies urgency as **Mild / Moderate / Emergency**. |
| 🎙️ **Voice Input/Output** | Speak symptoms via mic → Sarvam AI transcribes → AI responds → Text-to-Speech playback. Full voice-first experience. |
| 🏥 **Hospital Discovery** | Find nearby hospitals by live GPS, filter by specialty and type (government/private/trust). Distance calculated using Haversine formula. |
| 🗺️ **Indoor Navigation** | Step-by-step walking directions inside hospitals using BFS pathfinding on indoor map graphs. |
| 📋 **Doctor-Ready Summary** | Generate structured symptom summaries (chief complaint, duration, severity, associated symptoms) that patients can show to doctors. |
| 🏛️ **Govt. Scheme Matcher** | AI explains eligible government healthcare schemes (Ayushman Bharat, PM-JAY, MJPJAY, etc.) in the user's language. |
| 👨‍👩‍👧 **Caregiver Mode** | Link family members — they receive push notifications when the patient completes a triage. |
| 🔐 **Authentication** | Email/Password + Google OAuth via Supabase Auth. Guest mode available for demos. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + TailwindCSS |
| **Backend** | Python FastAPI (managed via `uv`) |
| **Database** | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| **AI Engine** | Google Gemini 2.5 Flash Lite |
| **Voice** | Sarvam AI (STT: `saaras:v3`, TTS: `bulbul:v3`) — Hindi, Marathi, English |
| **Maps** | Google Maps API + `@react-google-maps/api` |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **Deployment** | Render (Backend) + Vercel (Frontend) |

---

## 📁 Project Structure

```
mediguide-ai/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── pyproject.toml             # Python dependencies (uv)
│   ├── requirements.txt           # Fallback pip dependencies
│   ├── render.yaml                # Render.com deployment config
│   ├── .env                       # Environment variables (git-ignored)
│   └── app/
│       ├── config.py              # Pydantic settings (loads .env)
│       ├── utils.py               # Common helpers
│       ├── db/
│       │   └── supabase_client.py # Supabase client singleton (anon + service role)
│       ├── models/                # Pydantic request/response models
│       │   ├── chat_models.py     # Triage, Chat, Summary schemas
│       │   └── user_models.py     # Profile schemas
│       ├── routers/               # FastAPI route handlers
│       │   ├── triage.py          # POST /api/triage
│       │   ├── chat.py            # POST /api/chat, /api/chat/summary
│       │   ├── voice.py           # POST /api/voice/stt, /api/voice/tts
│       │   ├── hospitals.py       # GET /api/hospitals/nearby, /:id
│       │   ├── profile.py         # GET/PUT /api/profile
│       │   ├── schemes.py         # GET /api/schemes/*
│       │   ├── navigation.py      # GET /api/navigation/:id/map, /route
│       │   └── caregiver.py       # POST /api/caregiver/*
│       ├── services/              # Business logic layer
│       │   ├── gemini_service.py  # Google Gemini AI (triage + summary)
│       │   ├── sarvam_service.py  # Sarvam AI (STT + TTS)
│       │   ├── triage_service.py  # Rule-based urgency classifier
│       │   ├── hospital_service.py
│       │   ├── scheme_service.py
│       │   ├── navigation_service.py
│       │   ├── caregiver_service.py
│       │   └── fcm_service.py     # Firebase push notifications
│       └── prompts/               # AI prompt templates
│           ├── triage_prompt.txt  # Symptom triage system prompt
│           ├── summary_prompt.txt # Doctor-ready summary prompt
│           ├── scheme_prompt.txt  # Scheme explanation prompt
│           └── system_prompt.txt  # General health Q&A prompt
├── frontend/
│   ├── index.html                 # HTML entry point
│   ├── package.json               # Node dependencies
│   ├── vite.config.js             # Vite + proxy config
│   ├── tailwind.config.js         # Design system tokens
│   ├── .env.local                 # Frontend env vars (git-ignored)
│   └── src/
│       ├── App.jsx                # React Router setup
│       ├── main.jsx               # React entry
│       ├── index.css              # Global styles + design system
│       ├── pages/                 # Page components
│       │   ├── LoginPage.jsx      # Email/Google login + guest mode
│       │   ├── ChatPage.jsx       # AI triage chat interface
│       │   ├── HospitalPage.jsx   # Nearby hospitals (list + map)
│       │   ├── ProfilePage.jsx    # User profile management
│       │   ├── IndoorMapPage.jsx  # Indoor hospital navigation
│       │   └── CaregiverDashboard.jsx
│       ├── components/            # Reusable UI components
│       │   ├── chat/              # ChatBubble, ChatInput, VoiceButton, etc.
│       │   ├── hospital/          # HospitalCard, HospitalMapView
│       │   ├── map/               # Google Maps components
│       │   └── shared/            # Navbar, Spinner, ProtectedRoute, EmergencyAlert
│       ├── hooks/                 # React hooks
│       │   ├── useChat.js         # Chat state management
│       │   └── useGeolocation.js  # Browser GPS wrapper
│       ├── services/              # API + external service clients
│       │   ├── api.js             # Axios instance + all API functions
│       │   ├── supabase.js        # Supabase auth client
│       │   ├── sarvam.js          # Audio playback utilities
│       │   └── mapsHelper.js      # Google Maps URL builders
│       └── utils/                 # Formatters, language detection
│           ├── formatters.js      # Distance, phone, date, currency
│           └── languageDetect.js  # Script-based language detection
└── supabase/
    ├── schema.sql                 # Database schema + RLS + functions + triggers
    ├── seed_hospitals.sql         # 10 hospitals (Pune + Mumbai) with departments
    ├── seed_schemes.sql           # Government healthcare schemes
    ├── seed_indoor_map.sql        # Indoor navigation graph data
    └── seed_appointments.sql      # Sample appointment data
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** with [`uv`](https://docs.astral.sh/uv/) (recommended) or `pip`
- **Node.js 18+** and **npm**
- **Supabase account** (free tier works) — [supabase.com](https://supabase.com)
- **Google Gemini API key** — [Get one here](https://aistudio.google.com/apikey)
- **Sarvam AI API key** — [docs.sarvam.ai](https://docs.sarvam.ai)
- **Google Maps API key** — [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)

### 1. Clone & Setup Backend

```bash
cd backend

# Option A: Using uv (recommended)
uv sync
uv run uvicorn main:app --reload --port 8000

# Option B: Using pip
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Create `backend/.env` with your API keys:
```env
# ── Required ──
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SARVAM_API_KEY=your_sarvam_key
GOOGLE_MAPS_API_KEY=your_google_maps_key

# ── Required for Profile/Caregiver features ──
# Get from: Supabase Dashboard → Settings → API → service_role (secret)
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# ── Optional (for push notifications) ──
FCM_CREDENTIALS_JSON=
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Fill in `frontend/.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

The app will be available at **http://localhost:5173**

### 3. Setup Database

1. Go to your Supabase Dashboard → SQL Editor
2. Run `supabase/schema.sql` to create all tables, functions, RLS policies, and triggers
3. Run seed files in this order:
   - `seed_hospitals.sql` — 10 hospitals across Pune & Mumbai with departments
   - `seed_schemes.sql` — Government healthcare schemes
   - `seed_indoor_map.sql` — Indoor navigation graph data
   - `seed_appointments.sql` — Sample appointment data

### 4. Configure Supabase Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider (for email/password login)
3. Enable **Google** provider (for Google OAuth):
   - Add your Google OAuth Client ID and Secret
   - Set redirect URL to `http://localhost:5173/login`

---

## 🌍 Supported Languages

| Language | Code | Script | Voice |
|---|---|---|---|
| Hindi | `hi` | देवनागरी | STT + TTS via Sarvam AI |
| Marathi | `mr` | देवनागरी | STT + TTS via Sarvam AI |
| English | `en` | Latin | STT + TTS via Sarvam AI |

Mixed-language input (Hinglish) is also supported.

---

## 📱 API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/triage` | Symptom triage assessment |
| `POST` | `/api/chat` | General health chat |
| `POST` | `/api/chat/summary` | Doctor-ready symptom summary |
| `POST` | `/api/voice/stt` | Speech-to-Text (Sarvam AI) |
| `POST` | `/api/voice/tts` | Text-to-Speech (Sarvam AI) |
| `GET` | `/api/hospitals/nearby` | Find nearby hospitals by GPS |
| `GET` | `/api/hospitals/:id` | Hospital detail + departments |
| `GET` | `/api/hospitals/:id/departments` | Hospital departments |
| `GET` | `/api/schemes/eligible` | Eligible govt. schemes |
| `GET` | `/api/schemes/:id/explain` | AI-powered scheme explanation |
| `GET` | `/api/navigation/:id/map` | Indoor map graph |
| `GET` | `/api/navigation/:id/route` | Indoor route (BFS pathfinding) |
| `GET/PUT` | `/api/profile` | User profile |
| `POST` | `/api/profile/fcm` | Save FCM push token |
| `POST` | `/api/caregiver/link` | Link a caregiver |
| `GET` | `/api/caregiver/links` | Get caregiver links |
| `POST` | `/api/caregiver/notify` | Notify caregivers |
| `GET` | `/api/caregiver/alerts` | Alert history |

---

## 🏗️ Architecture

```
User (Mobile/Desktop)
    │
    ├── Voice Input → Sarvam STT (saaras:v3) → Text
    │
    ├── Text → FastAPI Backend
    │       ├── Gemini 2.5 Flash Lite (AI Triage + Summary)
    │       ├── Supabase (PostgreSQL DB + Auth)
    │       └── Google Maps (Hospital Discovery)
    │
    └── Response → Sarvam TTS (bulbul:v3) → Voice Output
```

---

## 👥 Team

Built by **Team MediGuide** for Smart India Hackathon (SIH).

---

## 📄 License

This project is built for educational and hackathon purposes.
