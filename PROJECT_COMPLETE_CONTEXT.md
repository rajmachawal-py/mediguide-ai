# MediGuide AI — Complete Project Documentation

> **Last Updated:** April 2026
> **Version:** 1.0.0
> **Purpose:** This file contains everything about the MediGuide AI project from start to end. Any LLM or developer reading this file will have full context to understand, modify, debug, or extend the system.

---

## 1. PROJECT OVERVIEW

**MediGuide AI** is a multilingual AI-powered healthcare assistant designed for Indian users. It is a Progressive Web App (PWA) that helps patients:

1. **Assess symptoms** through an AI chat interface (powered by Google Gemini)
2. **Get urgency triage** — AI classifies symptoms as Low / Moderate / Emergency
3. **Find nearby hospitals** using GPS geolocation
4. **Navigate inside hospitals** using interactive SVG indoor floor plans with pathfinding
5. **Discover government healthcare schemes** they're eligible for (Ayushman Bharat, PMJAY, etc.)
6. **Manage caregivers** — link family members who get push notifications during emergencies
7. **Generate health reports** — PDF health cards and FHIR R4 medical bundles
8. **Voice interaction** — full voice-in/voice-out mode using Sarvam AI (Hindi/Marathi/English)

**Target Users:** Indian patients, especially in rural/semi-urban areas who may not be tech-savvy. The app supports Hindi, Marathi, and English.

---

## 2. TECH STACK

### Backend
| Technology | Purpose |
|-----------|---------|
| **Python 3.12+** | Runtime |
| **FastAPI** | REST API framework |
| **Google Gemini (Vertex AI)** | AI model for triage, chat, scheme explanation |
| **Sarvam AI** | Speech-to-Text (STT) and Text-to-Speech (TTS) for Hindi/Marathi/English |
| **Supabase (PostgreSQL)** | Database + Auth (Row Level Security) |
| **Firebase Cloud Messaging** | Push notifications to caregivers |
| **Google Maps API** | Hospital geolocation and directions |
| **UV** | Python package manager (replaces pip) |
| **Pydantic Settings** | Environment variable management |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool and dev server |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client for API calls |
| **Supabase JS** | Auth client (Email, Google OAuth, Guest) |
| **Web Speech API** | Browser-native speech recognition (STT) |
| **IndexedDB** | Offline caching for indoor maps |
| **Service Worker** | PWA offline support |
| **react-hot-toast** | Toast notifications |
| **react-icons (Feather)** | Icon library |
| **jsPDF** | PDF health card generation |

### Database
| Technology | Purpose |
|-----------|---------|
| **Supabase (PostgreSQL)** | Hosted PostgreSQL with RLS policies |
| **PostGIS extensions** | Geospatial hospital queries |
| **pg_trgm** | Fuzzy text search on hospitals |

### External APIs
| Service | Used For |
|---------|----------|
| **Google Gemini 2.0 Flash** | AI triage, chat, symptom analysis, scheme explanations |
| **Sarvam AI** | Hindi/Marathi/English STT and TTS |
| **Google Maps Platform** | Nearby hospitals, directions |
| **Firebase Cloud Messaging** | Caregiver push notifications |

---

## 3. PROJECT STRUCTURE

```
mediguide-ai/
├── backend/                    # FastAPI backend
│   ├── main.py                 # App entry point (uvicorn main:app)
│   ├── .env                    # Environment variables (secrets)
│   ├── requirements.txt        # Python dependencies
│   ├── app/
│   │   ├── config.py           # Pydantic Settings (env vars)
│   │   ├── utils.py            # Shared utilities
│   │   ├── routers/            # API route handlers
│   │   │   ├── triage.py       # POST /api/triage
│   │   │   ├── chat.py         # POST /api/chat, /api/chat/summary
│   │   │   ├── voice.py        # POST /api/voice/stt, /api/voice/tts
│   │   │   ├── hospital.py     # GET /api/hospitals/nearby, /:id, /:id/departments
│   │   │   ├── scheme.py       # GET /api/schemes/eligible, /:id, /:id/explain
│   │   │   ├── navigation.py   # GET /api/navigation/:id/map, /:id/route
│   │   │   ├── profile.py      # GET/PUT /api/profile, POST /api/profile/fcm
│   │   │   ├── caregiver.py    # POST/GET/DELETE caregiver endpoints
│   │   │   └── appointment.py  # Placeholder (future)
│   │   ├── services/           # Business logic layer
│   │   │   ├── gemini_service.py      # Google Gemini AI integration
│   │   │   ├── sarvam_service.py      # Sarvam AI STT/TTS integration
│   │   │   ├── triage_service.py      # Symptom triage logic
│   │   │   ├── hospital_service.py    # Hospital search/geolocation
│   │   │   ├── scheme_service.py      # Government scheme matching
│   │   │   ├── navigation_service.py  # Indoor map BFS pathfinding
│   │   │   ├── caregiver_service.py   # Caregiver link management
│   │   │   ├── fcm_service.py         # Firebase push notifications
│   │   │   ├── rag_service.py         # Retrieval-Augmented Generation
│   │   │   └── audit_service.py       # API audit logging
│   │   ├── models/             # Pydantic request/response schemas
│   │   │   ├── chat_models.py
│   │   │   ├── hospital_models.py
│   │   │   ├── navigation_models.py
│   │   │   ├── scheme_models.py
│   │   │   └── user_models.py
│   │   ├── prompts/            # AI system prompts (text files)
│   │   │   ├── triage_prompt.txt      # Main triage assessment prompt
│   │   │   ├── system_prompt.txt      # General chat prompt
│   │   │   ├── summary_prompt.txt     # Doctor-ready summary generation
│   │   │   └── scheme_prompt.txt      # Scheme explanation prompt
│   │   ├── middleware/
│   │   │   └── audit_middleware.py    # Request audit logging
│   │   └── db/
│   │       └── supabase_client.py     # Supabase DB client
│
├── frontend/                   # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js          # Vite config with /api proxy
│   ├── package.json
│   ├── public/
│   │   ├── sw.js               # Service Worker (PWA)
│   │   ├── manifest.json       # PWA manifest
│   │   └── icons/              # App icons (192, 512)
│   ├── src/
│   │   ├── App.jsx             # Root component with routing
│   │   ├── main.jsx            # ReactDOM entry
│   │   ├── index.css           # Global styles + design system
│   │   ├── pages/              # Page components
│   │   │   ├── LoginPage.jsx           # Auth: Email/Google/Guest
│   │   │   ├── ChatPage.jsx            # Main triage chat interface
│   │   │   ├── HospitalPage.jsx        # Hospital finder with GPS
│   │   │   ├── IndoorMapPage.jsx       # Indoor SVG navigation
│   │   │   ├── CaregiverDashboard.jsx  # Caregiver management
│   │   │   ├── ProfilePage.jsx         # User profile & settings
│   │   │   └── PrivacyPolicyPage.jsx   # DPDPA compliance page
│   │   ├── components/
│   │   │   ├── chat/           # Chat-related components
│   │   │   │   ├── ChatBubble.jsx
│   │   │   │   ├── ChatInput.jsx
│   │   │   │   ├── VoiceButton.jsx            # Mic input (STT only, no TTS)
│   │   │   │   ├── VoiceAutoModeOverlay.jsx   # Full voice mode overlay
│   │   │   │   ├── ImageUploadButton.jsx
│   │   │   │   ├── UrgencyBanner.jsx
│   │   │   │   └── SchemeRecommendation.jsx
│   │   │   ├── hospital/       # Hospital-related components
│   │   │   │   ├── HospitalCard.jsx
│   │   │   │   └── SchemeCard.jsx
│   │   │   ├── map/            # Indoor map components
│   │   │   │   ├── SVGFloorPlan.jsx    # SVG floor plan renderer (3 floors)
│   │   │   │   ├── FloorSelector.jsx
│   │   │   │   ├── DepartmentSearch.jsx
│   │   │   │   ├── RouteOverlay.jsx
│   │   │   │   └── QRScanner.jsx
│   │   │   └── shared/         # Shared components
│   │   │       ├── Navbar.jsx          # Bottom tab navigation
│   │   │       ├── Spinner.jsx
│   │   │       ├── ProtectedRoute.jsx
│   │   │       ├── ConsentModal.jsx    # DPDPA consent
│   │   │       ├── ProfileOnboarding.jsx
│   │   │       ├── DisclaimerBanner.jsx
│   │   │       └── EmergencyAlert.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useChat.js              # Chat state management
│   │   │   ├── useGeolocation.js       # GPS location hook
│   │   │   ├── useVoiceAutoMode.js     # Voice mode (STT+TTS loop)
│   │   │   └── useVoiceRecorder.js     # Audio recording hook
│   │   ├── services/           # API and utility services
│   │   │   ├── api.js                  # Axios API client
│   │   │   ├── supabase.js             # Supabase auth client
│   │   │   ├── sarvam.js               # Sarvam audio playback
│   │   │   ├── firebase.js             # FCM push registration
│   │   │   ├── healthCardGenerator.js  # PDF health card (jsPDF)
│   │   │   ├── fhirExport.js           # FHIR R4 bundle export
│   │   │   ├── offlineMapCache.js      # IndexedDB map caching
│   │   │   └── mapsHelper.js           # Google Maps URL helpers
│   │   └── contexts/
│   │       └── LanguageContext.jsx      # i18n language provider
│
├── supabase/                   # Database schema & seed data
│   ├── schema.sql              # Full database schema (tables, RLS, indexes)
│   ├── schema_audit_logs.sql   # Audit logging table
│   ├── seed_hospitals.sql      # Hospital seed data (Indian hospitals)
│   ├── seed_schemes.sql        # Government scheme seed data
│   ├── seed_ruby_hall_map.sql  # Ruby Hall Clinic indoor map (nodes + edges)
│   ├── seed_indoor_map.sql     # Generic indoor map template
│   ├── seed_indoor_map_all.sql # All hospitals indoor maps
│   ├── seed_appointments.sql   # Sample appointment data
│   └── run_seed.py             # Python script to run all seeds
│
├── pyproject.toml              # Root Python project config (UV)
├── uv.lock                     # UV lockfile
├── stichdesign.md              # Frontend design spec for Google Stitch
└── README.md                   # Project readme
```

---

## 4. ENVIRONMENT VARIABLES

### Backend (`backend/.env`)
```env
# Google Gemini AI (Vertex AI)
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GEMINI_API_KEY=                    # Fallback if not using Vertex AI

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Sarvam AI (Voice)
SARVAM_API_KEY=your-sarvam-api-key

# Google Maps
GOOGLE_MAPS_API_KEY=your-maps-api-key

# Firebase (Caregiver Push)
FCM_CREDENTIALS_JSON={"type":"service_account",...}

# App
APP_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env.local`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key
VITE_API_BASE_URL=/api
```

---

## 5. DATABASE SCHEMA

### Tables (13 total)

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles (extends auth.users) | Owner only |
| `hospitals` | Hospital master data | Public read |
| `departments` | Hospital departments | Public read |
| `hospital_specialties` | Hospital ↔ Specialty mapping | Public read |
| `appointments` | Patient appointments | Owner only |
| `schemes` | Government healthcare schemes | Public read |
| `chat_sessions` | Chat conversation sessions | Owner only |
| `chat_messages` | Individual chat messages | Owner only |
| `caregiver_links` | Patient ↔ Caregiver links | Owner only |
| `caregiver_alerts` | Push notification log | Owner only |
| `indoor_map_nodes` | Hospital floor plan graph nodes | Public read |
| `indoor_map_edges` | Graph edges between nodes | Public read |
| `audit_logs` | API request audit trail | Admin only |

### Enums
- `language_code`: `hi`, `mr`, `en`
- `urgency_level`: `mild`, `moderate`, `emergency`
- `gender_type`: `male`, `female`, `other`, `prefer_not_to_say`
- `appointment_status`: `pending`, `confirmed`, `cancelled`, `completed`
- `caregiver_status`: `pending`, `active`, `revoked`
- `hospital_type`: `government`, `private`, `trust`, `clinic`

---

## 6. API ENDPOINTS

All APIs are served from the FastAPI backend at prefix `/api`.

### Triage & Chat
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/triage` | `{symptom, language, history[], lat, lng, image_base64?, patient_context?}` | `{reply, urgency, is_final, specialty, urgency_data}` |
| POST | `/api/chat` | `{message, language, history[]}` | `{reply}` |
| POST | `/api/chat/summary` | `{history[]}` | `{summary}` |

### Voice
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/voice/stt` | `FormData: file (audio), language` | `{transcript}` |
| POST | `/api/voice/tts` | `{text, language}` | Audio blob (binary) |

### Hospitals
| Method | Endpoint | Params | Response |
|--------|----------|--------|----------|
| GET | `/api/hospitals/nearby` | `lat, lng, radius_km, specialty?` | `[{hospital}]` |
| GET | `/api/hospitals/:id` | — | `{hospital}` |
| GET | `/api/hospitals/:id/departments` | — | `[{department}]` |

### Schemes
| Method | Endpoint | Params | Response |
|--------|----------|--------|----------|
| GET | `/api/schemes/eligible` | `state?, income?, age?, gender?, condition?` | `[{scheme}]` |
| GET | `/api/schemes/:id` | — | `{scheme}` |
| GET | `/api/schemes/:id/explain` | `language, state?, age?` | `{explanation}` |

### Navigation
| Method | Endpoint | Params | Response |
|--------|----------|--------|----------|
| GET | `/api/navigation/:hospitalId/map` | — | `{nodes[], edges[], floors[], hospital_name}` |
| GET | `/api/navigation/:hospitalId/route` | `from, to, accessible_only?` | `{steps[], total_distance}` |

### Profile
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/profile` | — | `{profile}` |
| PUT | `/api/profile` | `{name?, age?, gender?, state?, ...}` | `{profile}` |
| POST | `/api/profile/fcm` | `{fcm_token}` | `{success}` |

### Caregiver
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/caregiver/link` | `{caregiver_phone, caregiver_name, relationship}` | `{link}` |
| GET | `/api/caregiver/links` | — | `[{link}]` |
| DELETE | `/api/caregiver/link/:id` | — | `{success}` |
| POST | `/api/caregiver/notify` | `{urgency, summary}` | `{sent_count}` |
| GET | `/api/caregiver/alerts` | `limit?` | `[{alert}]` |

---

## 7. AI SYSTEM

### Triage Flow
1. User describes symptoms in any language
2. Patient details (name, age, gender, state) are auto-prepended from profile
3. Gemini asks 3-5 focused follow-up questions (one at a time)
4. After sufficient context, Gemini outputs a JSON assessment:
   ```json
   {
     "urgency": "moderate",
     "patient_message": "Based on your symptoms...",
     "recommended_specialty": "cardiology",
     "key_symptoms": ["chest pain", "shortness of breath"],
     "precautions": ["Rest", "Avoid exertion"],
     "is_final": true
   }
   ```
5. Emergency symptoms (chest pain, stroke signs, severe bleeding) → **immediate emergency** classification without follow-ups

### Voice I/O Architecture
| Feature | Input | Output |
|---------|-------|--------|
| Text chat (keyboard) | Text | Text only |
| Mic button (🎤) | Voice → Web Speech API STT → text | Text only (NO TTS) |
| Voice Mode (🗣️) | Voice → STT → send | TTS audio → auto-loops |

### Language Rules
- Language is set by the user's preference, NOT auto-detected from text
- The `[User's language: ...]` tag is prepended to every message
- Gemini MUST respond entirely in the specified language
- Hindi/Marathi use Devanagari script

---

## 8. INDOOR NAVIGATION SYSTEM

### Architecture
- Hospital floor plans are drawn as **SVG** components in React
- Navigation graph is stored as **nodes + edges** in PostgreSQL
- Pathfinding uses **BFS** algorithm (client-side for offline, server-side for online)
- Routes follow **corridors** via junction waypoints — never cut through rooms
- Supports **accessibility mode** (wheelchair — uses lifts instead of stairs)

### Node Types
- `entrance` — Hospital entry points
- `department` — Rooms linked to a department
- `waypoint` — Corridor junctions (invisible to user, used for routing)
- `lift` — Elevators (accessible, connect floors)
- `stairs` — Staircases (NOT accessible, connect floors)

### Coordinate System
- SVG viewBox: `0 0 1100 750`
- Positions stored as percentages (0-100): `SVG_x = (x_pos / 100) * 1100`
- Routes rendered as animated dashed blue polylines

### Currently Mapped Hospital
- **Ruby Hall Clinic, Pune** — 3 floors (Ground, First, Second)
- ~70 nodes, ~100 edges per hospital

---

## 9. USER FLOW

```
1. Open App → /login
2. Login via Email / Google / Guest
3. DPDPA Consent Modal (mandatory)
4. Profile Onboarding Modal (name, age, gender, state, language)
5. Main App → /chat (default)
6. Bottom Nav: Chat | Hospitals | Caregiver | Profile
7. Chat → Describe symptoms → AI triage → Urgency banner
8. If emergency → Emergency Alert overlay → Nearest hospital + Call Ambulance
9. Post-triage → Generate Report → Download Health Card → View Schemes
10. Hospitals → Find nearby → Select → Indoor Map → Navigate
11. Caregiver → Link family → Auto-notify on emergencies
12. Profile → Edit details → App settings → Sign out
```

---

## 10. AUTHENTICATION

| Method | Implementation |
|--------|---------------|
| Email/Password | Supabase `signUpWithEmail` / `signInWithEmail` |
| Google OAuth | Supabase `signInWithOAuth({provider: 'google'})` |
| Guest Mode | Skip auth, store data in localStorage only |

- JWT tokens attached via Axios request interceptor
- Protected routes wrapped in `<ProtectedRoute>` component
- Session expiry triggers `auth:expired` event

---

## 11. OFFLINE CAPABILITIES

| Feature | Offline Support |
|---------|----------------|
| Indoor Maps | ✅ Cached in IndexedDB, BFS runs client-side |
| Hospital List | ✅ Cached from last fetch |
| Chat History | ✅ Stored in localStorage |
| Triage Chat | ❌ Requires API (Gemini) |
| Voice STT/TTS | ⚠️ Web Speech API works offline, Sarvam API doesn't |
| Static Assets | ✅ Service Worker cache |

---

## 12. KEY FEATURES SUMMARY

| # | Feature | Status |
|---|---------|--------|
| 1 | AI Symptom Triage (Gemini) | ✅ Working |
| 2 | Multilingual (EN/HI/MR) | ✅ Working |
| 3 | Voice Input (Mic/Web Speech) | ✅ Working |
| 4 | Voice Mode (Full Duplex TTS) | ✅ Working |
| 5 | Visual Symptom Upload (Camera) | ✅ Working |
| 6 | Emergency Detection & Alert | ✅ Working |
| 7 | Nearby Hospital Finder (GPS) | ✅ Working |
| 8 | Indoor Hospital Navigation (SVG) | ✅ Working |
| 9 | Government Scheme Discovery | ✅ Working |
| 10 | Caregiver Linking & Push Notifications | ✅ Working |
| 11 | Health Card PDF Generation | ✅ Working |
| 12 | FHIR R4 Bundle Export | ✅ Working |
| 13 | DPDPA Consent Compliance | ✅ Working |
| 14 | Offline Mode (PWA) | ✅ Working |
| 15 | Audit Trail Logging | ✅ Working |

---

## 13. HOW TO RUN

### Prerequisites
- Node.js 18+
- Python 3.12+
- UV (Python package manager): `pip install uv`
- Supabase project (with schema + seeds run)
- Google Cloud project with Gemini API enabled
- Sarvam AI API key
- Google Maps API key

### Backend
```bash
cd backend
uv run uvicorn main:app --reload --port 8000
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
# Vite proxies /api/* → localhost:8000
```

### Database Setup
1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/schema_audit_logs.sql`
4. Run seed files: `seed_hospitals.sql`, `seed_schemes.sql`, `seed_ruby_hall_map.sql`
5. Or use `python supabase/run_seed.py` to run all seeds

---

## 14. DEPLOYMENT

### Backend → Render.com
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Config: `render.yaml` in backend directory

### Frontend → Vercel
- Framework: Vite
- Build: `npm run build`
- Output: `dist/`
- Env vars: Set VITE_* variables in Vercel dashboard

---

## 15. IMPORTANT NOTES FOR LLMs

1. **Never ask for patient name/age/gender in triage** — these are pre-collected during onboarding and auto-prepended to every message
2. **Language is set by preference, not detected** — always use the `language` parameter
3. **Mic button = input only** — the mic button does NOT trigger TTS. Only Voice Mode does.
4. **Indoor map routes follow corridors** — the graph uses junction waypoints on corridors to ensure routes never cut through rooms
5. **Supabase RLS is enforced** — always pass JWT tokens. Backend uses service key for admin operations.
6. **All coordinates are percentages** (0-100) — converted to SVG viewBox (1100×750) at render time
7. **Emergency = immediate** — no follow-up questions for chest pain, stroke, bleeding, etc.
8. **Guest mode** stores everything in localStorage — no server-side profile, no push notifications
9. **Service Worker** can cache old code — clear SW + hard refresh if changes don't appear
10. **api.js must not have duplicate exports** — duplicate function names cause SyntaxError → white screen
