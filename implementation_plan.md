# MediGuide AI — Build Order & Implementation Plan

A full-stack multilingual healthcare navigation assistant built with FastAPI (Python) + React (Vite) + Supabase + Gemini AI + Sarvam AI.

---

## 📊 Team Progress Dashboard

> Last updated: 2026-04-10 | Updated by: Lakshay

| Phase | Status | Completed By |
|---|---|---|
| **Phase 1 — Backend Foundation** | ✅ 100% Complete | Lakshay |
| **Phase 2 — Core Feature APIs** | ⬜ Not Started | — |
| **Phase 3 — Frontend Core** | ⬜ Not Started | — |
| **Phase 4 — Advanced Features** | ⬜ Not Started | — |

### ✅ Completed Files — DO NOT re-create or overwrite these

| File | Status | Notes |
|---|---|---|
| `supabase/schema.sql` | ✅ Done | 11 tables, RLS, Haversine fn, Realtime — **live on Supabase** |
| `supabase/seed_hospitals.sql` | ✅ Done | 10 hospitals, 51 depts, 44 specialties — verified |
| `supabase/seed_schemes.sql` | ✅ Done | 8 govt schemes — UUID bug fixed |
| `supabase/seed_appointments.sql` | ✅ Done | Template only — needs real auth UUIDs to run |
| `backend/.env` | ✅ Done | All keys present — **NEVER COMMIT** |
| `backend/app/config.py` | ✅ Done | pydantic-settings singleton |
| `backend/main.py` | ✅ Done | FastAPI app, CORS, 8 routers, health checks |
| `backend/app/db/supabase_client.py` | ✅ Done | Anon + service role clients |
| `backend/app/prompts/triage_prompt.txt` | ✅ Done | Multilingual triage nurse + emergency rules |
| `backend/app/prompts/summary_prompt.txt` | ✅ Done | Doctor-ready summary schema |
| `backend/app/prompts/scheme_prompt.txt` | ✅ Done | Scheme explanation in user's language |
| `backend/app/services/gemini_service.py` | ✅ Done | ask_triage, generate_summary, explain_scheme |
| `backend/app/services/triage_service.py` | ✅ Done | classify_urgency + keyword rules in 3 languages |
| `backend/app/models/chat_models.py` | ✅ Done | All Pydantic models for chat/triage/summary |
| `backend/app/routers/triage.py` | ✅ Done | POST /api/triage |
| `backend/app/routers/chat.py` | ✅ Done | POST /api/chat + POST /api/chat/summary |
| `backend/app/routers/voice.py` | 🔲 Stub | Empty — Phase 2 work |
| `backend/app/routers/hospital.py` | 🔲 Stub | Empty — Phase 2 work |
| `backend/app/routers/scheme.py` | 🔲 Stub | Empty — Phase 2 work |
| `backend/app/routers/caregiver.py` | 🔲 Stub | Empty — Phase 4 work |
| `backend/app/routers/navigation.py` | 🔲 Stub | Empty — Phase 4 work |
| `backend/app/routers/appointment.py` | 🔲 Stub | Empty — Phase 4 work |
| `.gitignore` | ✅ Done | All secrets, venv, Firebase, certs covered |

### ⚠️ Team Coordination Rules

1. **Never overwrite** any file marked ✅ Done without discussing with the team first.
2. **Stub routers** (🔲) are intentionally empty — implement them in their designated Phase.
3. **Database is live on Supabase** — any schema changes must be discussed before running SQL.
4. **Seed data is verified correct** — hospital departments confirmed from official sources (April 2026).
5. **`.env` is not in git** — get keys from Lakshay and create your own local `.env`.
6. **Virtual environment**: install dependencies with `pip install -r requirements.txt` in `backend/`.

### 🔑 Keys Every Team Member Needs (get from Lakshay)
- `GEMINI_API_KEY` — Google AI Studio
- `SUPABASE_URL` + `SUPABASE_KEY` + `SUPABASE_SERVICE_KEY` — Supabase project
- `SARVAM_API_KEY` — sarvam.ai dashboard
- `GOOGLE_MAPS_API_KEY` — already in project .env
- `FCM_CREDENTIALS_JSON` — Firebase Admin SDK (gitignored JSON file)

### 🚀 How to Run Backend Locally
```bash
cd backend
.\mediguide-Venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn main:app --reload
# Open: http://localhost:8000/docs       (Swagger UI — test all endpoints)
# Open: http://localhost:8000/api/health (confirms all API keys are loaded)
```

---

## ✅ Phase 1 — Backend Foundation *(COMPLETE — do not modify)*

### ✅ Step 1 · Database Schema *(DONE — live on Supabase)*
#### [DONE] `supabase/schema.sql`
- 11 tables with full RLS, indexes, `haversine_km()` + `get_nearby_hospitals()` SQL functions
- Supabase Realtime on `caregiver_alerts` + `chat_sessions`
- Auto-profile trigger on OTP signup

#### [DONE] `supabase/seed_hospitals.sql`
- 10 hospitals (Pune + Mumbai), 51 verified departments, 44 specialty tags
- UUID pattern: `00000000-0000-0000-0000-0000000000xx` (hospitals), `10000000-00xx-...` (departments)

#### [DONE] `supabase/seed_schemes.sql`
- 8 government schemes with full eligibility arrays. UUID pattern: `20000000-...`

#### [DONE] `supabase/seed_appointments.sql`
- Template file with UUID reference card; inserts are commented out (need real auth UUIDs)

---

### ✅ Step 2 · Config & Entry Point *(DONE)*
#### [DONE] `backend/app/config.py`
- `pydantic-settings` with all 8 env vars, `@lru_cache` singleton

#### [DONE] `backend/main.py`
- FastAPI + CORS for `FRONTEND_URL` + Vercel production URL
- 8 routers mounted under `/api` prefix
- `GET /` + `GET /api/health` health check endpoints

#### [DONE] `backend/app/db/supabase_client.py`
- `get_client()` — anon key (RLS enforced)
- `get_service_client()` — service role key (bypasses RLS for admin ops)

---

### ✅ Step 3 · Core AI Services *(DONE)*
#### [DONE] `backend/app/prompts/triage_prompt.txt`
- Multilingual triage nurse (hi/mr/en), one question at a time
- Emergency escalation list in all 3 languages; outputs structured JSON result block

#### [DONE] `backend/app/prompts/summary_prompt.txt`
- Doctor-ready summary in English from full conversation

#### [DONE] `backend/app/prompts/scheme_prompt.txt`
- Explains govt schemes in user's language given their profile

#### [DONE] `backend/app/services/gemini_service.py`
- `ask_triage()`, `generate_summary()`, `explain_scheme()`
- Chat session with full history, `_extract_json_block()` parser, medical safety settings

#### [DONE] `backend/app/services/triage_service.py`
- `classify_urgency()` — dual-layer: keyword rules + AI (rules can only escalate, never downgrade)
- `get_urgency_display()` — color/emoji/label/advice in hi/mr/en for `UrgencyBanner`

---

### ✅ Step 4 · First Working API Endpoints *(DONE)*
#### [DONE] `backend/app/routers/triage.py`  
- `POST /api/triage` — keyword pre-scan → Gemini → final classify pipeline
- Emergency keywords force `is_final=True` + `call_ambulance=True` mid-conversation

#### [DONE] `backend/app/routers/chat.py`
- `POST /api/chat` — stateless chat (client sends full history)
- `POST /api/chat/summary` — structured doctor summary with field validation + safe defaults

#### [DONE] `backend/app/models/chat_models.py`
- `TriageRequest` (with optional lat/lng), `TriageResponse`, `UrgencyDisplay`
- `ChatRequest`, `ChatResponse`, `SummaryRequest`, `SummaryResponse`
- All models have Swagger examples

---

## Phase 2 — Core Feature APIs

> Voice first, then hospitals, then scheme matching.

### Step 5 · Voice — Sarvam AI Integration *(Voice before Hospitals)*
#### [MODIFY] `backend/app/services/sarvam_service.py`
- `speech_to_text(audio_bytes, language_code)` → transcribed text (Hindi: `hi-IN`, Marathi: `mr-IN`, English: `en-IN`)
- `text_to_speech(text, language_code)` → returns audio bytes (MP3/WAV)
- Wraps [Sarvam AI REST API](https://sarvam.ai)

#### [MODIFY] `backend/app/routers/voice.py`
- `POST /api/voice/stt` — accepts audio file upload, returns transcribed text in detected language
- `POST /api/voice/tts` — accepts text + language, returns audio stream

---

### Step 6 · Hospital Discovery
#### [MODIFY] `backend/app/services/hospital_service.py`
- `find_nearby_hospitals(lat, lng, radius_km, specialty?)` — calls `get_nearby_hospitals()` SQL function (Haversine, no PostGIS needed)
- `get_hospital_departments(hospital_id)` — fetches departments, doctors, availability
- `get_hospital_by_id(hospital_id)` — returns single hospital with full detail including `google_maps_url`

#### [MODIFY] `backend/app/routers/hospital.py`
- `GET /api/hospitals/nearby?lat=&lng=&radius_km=&specialty=` — returns hospitals sorted by distance
- `GET /api/hospitals/{id}` — single hospital detail (used before opening map)
- `GET /api/hospitals/{id}/departments` — departments list with floor numbers

#### [MODIFY] `backend/app/models/hospital_models.py`
- Pydantic models: `Hospital`, `Department`, `HospitalListResponse`

---

### Step 6.5 · Maps & Location *(Outdoor + Indoor)*

> Two distinct map layers: **Outdoor** (getting TO the hospital) and **Indoor** (navigating INSIDE the hospital).

#### Outdoor Navigation — Getting to the Hospital

**Approach: Google Maps JavaScript API via `@react-google-maps/api`**
- Uses `GOOGLE_MAPS_API_KEY` (stored in `.env.local` on frontend, `.env` on backend)
- Library: `@react-google-maps/api` (React wrapper for Google Maps JS API)
- Enables: interactive map, custom markers, Directions Service, Places autocomplete
- APIs to enable in Google Cloud Console:
  - **Maps JavaScript API** — renders the map
  - **Directions API** — in-app route drawing
  - **Geocoding API** (optional) — fallback lat/lng from city name

#### [MODIFY] `frontend/src/hooks/useGeolocation.js`
- Wraps browser `navigator.geolocation.getCurrentPosition()`
- Returns `{ lat, lng, accuracy, error, loading }`
- Falls back to city-level defaults if permission denied (Pune: 18.5204, 73.8567 / Mumbai: 19.0760, 72.8777)
- Persists last known location in `localStorage`

#### [NEW] `frontend/src/components/map/HospitalMapView.jsx`
- `GoogleMap` component from `@react-google-maps/api` centred on user's location
- Custom `Marker` per hospital (color-coded: red = emergency, blue = private, green = government)
- `InfoWindow` on marker click: hospital name, distance, specialty tags, Directions + Indoor Map buttons
- `Marker` for user location with pulsing CSS animation
- Map type toggle: Road / Satellite

#### [MODIFY] `frontend/src/components/hospital/HospitalCard.jsx`
- Shows hospital name (in selected language), type badge, distance in km
- **"Directions" button** → uses Google Maps Directions Service to draw route on map, or opens `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` in new tab on mobile
- **"Ambulance" button** (emergency only) → `tel:108`
- **"Indoor Map" button** → `/map/{hospital_id}`

#### [NEW] `frontend/src/services/mapsHelper.js`
- `getDirectionsUrl(lat, lng)` — builds Google Maps deep-link URL
- `getEmbedUrl(lat, lng)` — Google Maps Embed API URL for static preview
- `getAmbulanceLink()` → `tel:108`
- `formatDistance(km)` — `"2.3 km"` or `"850 m"`
- Reads key from `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`

#### Emergency Location Flow
- When urgency = `emergency`, `UrgencyBanner` calls `useGeolocation`
- Auto-finds nearest hospital with `has_emergency = TRUE` via `/api/hospitals/nearby`
- Shows hospital name, distance, one-tap **"Call Ambulance (108)"** CTA
- Directions button auto-opens Google Maps navigation for that hospital

#### Environment Variables to Add
```
# frontend/.env.local
VITE_GOOGLE_MAPS_API_KEY=your_key_here

# backend/.env (if backend proxies map requests in future)
GOOGLE_MAPS_API_KEY=your_key_here
```

#### Indoor Navigation — Inside the Hospital

#### [MODIFY] `backend/app/routers/navigation.py`
- `GET /api/navigation/{hospital_id}/map` — returns all nodes + edges + floor map image URL
- `GET /api/navigation/{hospital_id}/route?from=entrance&to={dept_id}` — runs BFS, returns step list

#### [NEW] `backend/app/services/navigation_service.py`
- `get_map_graph(hospital_id)` — fetches `indoor_map_nodes` + `indoor_map_edges` from Supabase
- `find_route(hospital_id, from_node_id, to_node_id)` — BFS/Dijkstra, returns `[{ step, label, floor, direction }]`
- Steps rendered in plain language: *"Turn left at Lift → Take Lift to Floor 2 → Walk to Room 202"*

#### [MODIFY] `frontend/src/pages/IndoorMapPage.jsx`
- Loads floor map SVG + graph from `/api/navigation/{hospital_id}/map`
- Department selector triggers `/api/navigation/{hospital_id}/route`
- Renders `FloorMap` + `NavigationPanel` side-by-side with floor switcher

#### [MODIFY] `frontend/src/components/map/FloorMap.jsx`
- SVG overlay on hospital floor image; route highlighted green with animated dashes
- Tap a department node to set as destination

#### [MODIFY] `frontend/src/components/map/NavigationPanel.jsx`
- Step-by-step directions in user's language with walk/lift/stairs icons
- "Accessible route only" toggle — excludes `is_accessible = FALSE` edges

#### [MODIFY] `frontend/src/components/map/DepartmentSearch.jsx`
- Searchable dropdown in Hindi/Marathi/English from `/api/hospitals/{id}/departments`
- On select → triggers route fetch

---

### Step 7 · Government Scheme Eligibility
#### [MODIFY] `backend/app/services/scheme_service.py`
- `get_eligible_schemes(user_profile)` — matches income, state, condition to seeded scheme rules
- `explain_scheme(scheme_id, language)` — uses Gemini to explain scheme in user's language

#### [MODIFY] `backend/app/routers/scheme.py`
- `GET /api/schemes/eligible?state=&income=&condition=` — returns list of applicable schemes
- `GET /api/schemes/{id}/explain?language=` — returns plain-language scheme explanation

#### [MODIFY] `backend/app/models/scheme_models.py`
- Pydantic models: `Scheme`, `SchemeEligibilityRequest`, `SchemeListResponse`

---

## Phase 3 — Frontend Core

> Route guards go in from day one — no unprotected pages.

### Step 8 · Service Layer & App Shell
#### [MODIFY] `frontend/src/services/api.js`
- Axios instance with `baseURL` pointing to FastAPI backend
- Request interceptor to attach Supabase JWT token from localStorage
- Response interceptor for 401 → redirect to login

#### [MODIFY] `frontend/src/services/supabase.js`
- Supabase JS client singleton
- `getCurrentUser()`, `signIn()`, `signOut()` helpers

#### [MODIFY] `frontend/src/App.jsx`
- React Router v6 setup
- **Route guards immediately**: `<ProtectedRoute>` wrapper component — redirects unauthenticated users to `/login`
- Routes: `/login`, `/chat` (protected), `/hospitals` (protected), `/profile` (protected), `/caregiver` (protected), `/map/:hospitalId` (protected)

#### [NEW] `frontend/src/components/shared/ProtectedRoute.jsx`
- Checks Supabase session; renders children or `<Navigate to="/login" />`

---

### Step 9 · Chat UI
#### [MODIFY] `frontend/src/pages/ChatPage.jsx`
- Language selector (Hindi / Marathi / English) persisted to localStorage
- Symptom input area with text and voice toggle
- Renders chat thread with urgency-aware styling
- Calls `/api/triage` and `/api/chat`, displays follow-up questions

#### [MODIFY] `frontend/src/components/chat/ChatBubble.jsx`
- User vs. AI bubble styling; supports RTL for Hindi/Marathi text direction

#### [MODIFY] `frontend/src/components/chat/ChatInput.jsx`
- Text input + send button; auto-disables during AI response loading

#### [MODIFY] `frontend/src/components/chat/VoiceButton.jsx`
- Uses `useVoiceRecorder` hook; sends audio to `/api/voice/stt`, fills ChatInput with transcript

#### [MODIFY] `frontend/src/components/chat/UrgencyBanner.jsx`
- Color-coded banner: 🟢 Mild / 🟡 Moderate / 🔴 Emergency
- Emergency state shows ambulance button + nearest hospital CTA

#### [MODIFY] `frontend/src/hooks/useVoiceRecorder.js`
- MediaRecorder API wrapper; start/stop/reset; returns `audioBlob`

#### [MODIFY] `frontend/src/hooks/useChat.js`
- Manages `messages[]`, `urgency`, `isLoading` state
- Calls `api.js` functions for chat and triage

#### [MODIFY] `frontend/src/pages/HospitalPage.jsx`
- Shows nearby hospitals from `/api/hospitals/nearby` using user geolocation
- Hospital cards with specialty, distance, department list, checklist

#### [MODIFY] `frontend/src/hooks/useGeolocation.js`
- Browser Geolocation API wrapper; returns `{ lat, lng, error }`

---

## Phase 4 — Advanced Features

> Auth first, then Caregiver Mode, then Indoor Map.

### Step 10 · Authentication *(Auth before everything else in Phase 4)*
#### [MODIFY] `frontend/src/pages/LoginPage.jsx`
- OTP-based phone login via Supabase Auth (India-first: no email dependency)
- Language-aware UI (Hindi/Marathi/English labels)
- On success: stores session, redirects to `/chat`

#### [MODIFY] `frontend/src/pages/ProfilePage.jsx`
- Editable fields: name, age, state, income bracket, preferred language
- Saves to Supabase `users` table; used for scheme eligibility matching

#### [MODIFY] `backend/app/models/user_models.py`
- Pydantic models: `UserProfile`, `UserUpdateRequest`

---

### Step 11 · Caregiver Mode
#### [MODIFY] `backend/app/services/caregiver_service.py`
- `link_caregiver(patient_id, caregiver_phone)` — creates `caregiver_links` record
- `notify_caregiver(patient_id, urgency, summary)` — triggers FCM push notification

#### [MODIFY] `backend/app/services/fcm_service.py`
- Firebase Admin SDK wrapper for push notifications
- `send_push(token, title, body, data)` helper

#### [MODIFY] `backend/app/routers/caregiver.py`
- `POST /api/caregiver/link` — link patient ↔ caregiver by phone
- `POST /api/caregiver/notify` — push urgency alert to caregiver's device

#### [MODIFY] `frontend/src/pages/CaregiverDashboard.jsx`
- Real-time patient status via Supabase Realtime subscriptions
- Shows urgency level, last symptom summary, timestamp
- Alert history log

#### [MODIFY] `frontend/src/services/firebase.js`
- Firebase JS SDK init; FCM token registration for push notifications

---

### Step 12 · Indoor Hospital Navigation *(fully detailed in Step 6.5)*
- All indoor map files already specified in **Step 6.5** above
- At this stage: wire up `IndoorMapPage` route guard, add floor map SVG assets per hospital to `frontend/src/assets/maps/`
- Seed `indoor_map_nodes` + `indoor_map_edges` for at least 1 hospital (Sassoon General) for demo
- Test full route: entrance → Cardiology OPD with accessibility toggle

---

## Verification Plan

### After Phase 1
- `uvicorn main:app --reload` starts without errors
- `GET /` returns `{ status: "ok" }`
- `POST /api/triage` with sample Hindi symptom text returns urgency + follow-up question

### After Phase 2
- `POST /api/voice/stt` with Hindi audio returns correct transcript
- `GET /api/hospitals/nearby?lat=18.52&lng=73.85&radius_km=10` returns Pune hospitals sorted by distance
- `GET /api/schemes/eligible` returns matching schemes for test profile
- `GET /api/navigation/{id}/route?from=entrance&to={dept_id}` returns BFS step list

### After Phase 3
- Unauthenticated `/chat` access → redirects to `/login`
- Browser geolocation prompt fires on `HospitalPage` load
- Leaflet map renders with hospital markers; clicking a marker shows popup with Directions button
- Directions button opens Google Maps in new tab with correct destination lat/lng
- Emergency urgency → `UrgencyBanner` shows nearest emergency hospital + "Call Ambulance (108)" button
- Full chat flow: type symptom → AI asks follow-up → urgency banner appears → hospital recommendation shown

### After Phase 4
- OTP login works end-to-end
- Caregiver receives FCM push when patient hits emergency urgency
- Indoor map renders for a hospital; department search triggers route highlight on SVG floor map
- Accessibility route toggle correctly avoids non-accessible edges
