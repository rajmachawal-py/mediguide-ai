# MediGuide AI — Frontend Design Specification

## Project Overview

**MediGuide AI** is a multilingual AI-powered healthcare assistant designed primarily for Indian users. It helps patients assess their symptoms through an intelligent chat interface, find nearby hospitals, navigate inside hospitals using indoor maps, discover eligible government healthcare schemes, manage caregiver relationships, and export health reports.

The app is built as a **mobile-first Progressive Web App (PWA)** — it must look and feel like a native mobile app on phones AND work beautifully on tablets and desktops. It supports **3 languages**: English, Hindi (हिंदी), and Marathi (मराठी). The interface should use a **clean white/light theme** as the primary design.

**Tech Stack:**
- Frontend: React 18+ with React Router v6
- Styling: CSS (no Tailwind)
- Auth: Supabase (Email/Password + Google OAuth + Guest Mode)
- Backend: FastAPI (Python) — all APIs at `/api/*`
- Voice: Web Speech API (STT) + Sarvam AI (TTS)
- AI: Google Gemini for chat/triage

---

## User Flow

```
App Launch → Login Page → DPDPA Consent Modal → Profile Onboarding → Main App
```

1. **Login Page** (`/login`) — User signs in via Email, Google, or continues as Guest
2. **DPDPA Consent Modal** — Full-screen modal asking for data processing consent (mandatory, cannot skip)
3. **Profile Onboarding Modal** — Collects: Name, Age, Gender, State, Primary Language (mandatory for all users including guests)
4. **Main App** — Bottom tab navigation between pages

---

## Pages & Features

### 1. Login Page (`/login`)
**Purpose:** Authentication entry point

**Auth Methods:**
- Email + Password (Sign Up / Sign In toggle)
- Google OAuth (one-click)
- Guest Mode (skip auth, use locally)

**Requirements:**
- Language selector (EN / HI / MR) accessible on this page
- Show app branding, logo, tagline
- Form validation with error messages
- Link to Privacy Policy page
- All text must be translatable in 3 languages

---

### 2. Chat Page (`/chat`) — **PRIMARY PAGE**
**Purpose:** AI-powered symptom triage and health assessment

**Features:**
- **Chat message list** — Scrollable conversation between User and AI
  - User messages (right-aligned)
  - AI messages (left-aligned) with optional urgency badge (🟢 Low / 🟡 Moderate / 🔴 Emergency)
  - Messages can contain images (user-uploaded symptom photos)
  - Each message shows timestamp
  
- **Input Area** (bottom):
  - Text input field with send button
  - 🎤 Mic button — for voice input (speech-to-text only, no audio response)
  - 📷 Camera button — for uploading/capturing symptom images
  
- **Header:**
  - App name & branding
  - 🗣️ Voice Mode button — activates full-screen voice overlay (voice in + voice out)
  - Language selector (EN/HI/MR)
  - Reset chat button

- **Voice Mode Overlay** (full screen when activated):
  - Animated mic/speaker indicators showing current phase
  - Phases: Listening (green) → Processing (purple) → Speaking (blue) → repeat
  - Live transcript display
  - Stop button to exit

- **Urgency Banner** — Appears when AI detects urgency level
  - 🟢 Low: Green banner
  - 🟡 Moderate: Yellow/Amber banner
  - 🔴 Emergency: Red banner with pulsing animation

- **Emergency Alert** — Full-screen overlay when urgency = emergency
  - Shows nearest hospital name, distance, phone
  - "Call Ambulance" button
  - "Get Directions" (opens Google Maps)

- **Post-Triage Actions** (shown after triage is complete):
  - "Generate Report" button → creates doctor-ready summary
  - "Download Health Card" (PDF)
  - "Export FHIR Bundle" (medical data standard)
  - Government Schemes section — shows eligible healthcare schemes based on user profile

- **Welcome State** (no messages yet):
  - App logo/icon
  - Welcome message
  - Quick suggestion chips: "I have a headache", "Stomach pain", "I have fever"

---

### 3. Hospital Finder Page (`/hospitals`)
**Purpose:** Find nearby hospitals based on user's GPS location

**Features:**
- Auto-detects GPS location
- List of nearby hospitals with:
  - Hospital name
  - Distance (km)
  - Address
  - Specialties available
  - "Navigate" button → opens indoor map
  - "Directions" → opens Google Maps
- Search/filter by specialty
- Works offline (cached data)

---

### 4. Indoor Map Page (`/map/:hospitalId`)
**Purpose:** Interactive indoor hospital navigation with SVG floor plans

**Features:**
- **SVG Floor Plan** — Professional architectural-style floor plan showing:
  - Rooms, departments, corridors, lifts, staircases
  - Color-coded by department type
  - Clickable department hotspots
  
- **Floor Selector** — Switch between Ground Floor, First Floor, Second Floor

- **Department Search** — Search/select destination department
  - Shows department list with floor info and wait times

- **Route Overlay** — Animated dotted blue line showing navigation path
  - START marker (green)
  - DESTINATION marker (red, pulsing)
  - Route follows corridors (L-shaped paths)

- **Step-by-step Directions** — Text directions panel
  - "Walk 15m along Main Corridor"
  - "Turn left at Radiology"
  - Voice readout option (TTS)

- **Accessibility Toggle** — Wheelchair-only paths (uses lifts instead of stairs)

- **QR Scanner** — Scan room QR codes for precise location

- **Offline Support** — Cached map data in IndexedDB

---

### 5. Caregiver Dashboard (`/caregiver`)
**Purpose:** Manage caregiver relationships and emergency notifications

**Features:**
- **Link Caregivers** — Add caregiver by phone number and name
  - Relationship type: Family / Friend / Doctor
  
- **Linked Caregivers List** — Show all linked caregivers
  - Name, phone, relationship
  - "Revoke" button to unlink
  
- **Alert History** — List of past notifications sent to caregivers
  - Timestamp, urgency level, summary text
  
- **Notify Caregivers** — Send emergency alert with current triage summary

---

### 6. Profile Page (`/profile`)
**Purpose:** View and edit user profile, app settings

**Features:**
- **User Info Section:**
  - Name, Age, Gender, State
  - Phone number (if available)
  - Email
  - Edit all fields
  
- **App Settings:**
  - Language preference (EN / HI / MR)
  - Notification preferences (push notifications toggle)
  
- **Health Data:**
  - Chronic conditions (diabetes, hypertension, etc.)
  - Allergies
  - Current medications
  - Blood group
  
- **Account Actions:**
  - Sign Out button
  - Delete Account option
  
- **Data Export:**
  - "Export My Data" (GDPR/DPDPA compliance)

---

### 7. Privacy Policy Page (`/privacy`)
**Purpose:** Legal compliance page

**Features:**
- DPDPA (Digital Personal Data Protection Act) compliance text
- Data collection, storage, and usage policies
- User rights
- Contact information
- Accessible from login page (public, no auth required)

---

## Shared Components / Modals

### DPDPA Consent Modal
- Full-screen blocking modal (cannot use app without accepting)
- Shows data processing consent text
- "I Agree" button
- Link to full privacy policy
- Multilingual

### Profile Onboarding Modal
- Step-by-step form modal (shown after consent)
- Collects: Full Name, Age, Gender, State (Indian state), Preferred Language
- Cannot skip — required for all users including guests
- Saved to localStorage

### Bottom Navigation Bar
- 4 tabs with icons:
  - 💬 Chat
  - 🏥 Hospitals
  - ❤️ Caregiver
  - 👤 Profile
- Active tab highlighted
- Always visible on all authenticated pages

### Disclaimer Banner
- Small persistent banner: "This is not medical advice. Please consult a qualified doctor."
- Shown on chat page

---

## API Endpoints Reference

All APIs are at base URL `/api`. The frontend uses Axios with JWT auth.

### Triage & Chat
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/triage` | Send symptoms for AI triage assessment |
| POST | `/api/chat` | General chat message |
| POST | `/api/chat/summary` | Generate doctor-ready symptom summary |

### Voice
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/voice/stt` | Speech-to-text (audio file → text) |
| POST | `/api/voice/tts` | Text-to-speech (text → audio blob) |

### Hospitals
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/hospitals/nearby?lat=&lng=&radius_km=` | Find nearby hospitals |
| GET | `/api/hospitals/:id` | Get hospital detail |
| GET | `/api/hospitals/:id/departments` | Get hospital departments |

### Schemes (Government Healthcare)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/schemes/eligible?state=&age=&gender=` | Find eligible schemes |
| GET | `/api/schemes/:id` | Get scheme detail |
| GET | `/api/schemes/:id/explain?language=` | AI explanation of scheme |

### Indoor Navigation
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/navigation/:hospitalId/map` | Get indoor map graph (nodes + edges) |
| GET | `/api/navigation/:hospitalId/route?from=&to=` | Calculate indoor route |

### Profile
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/profile` | Get current user profile |
| PUT | `/api/profile` | Update user profile |
| POST | `/api/profile/fcm` | Save push notification token |

### Caregiver
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/caregiver/link` | Link a caregiver |
| GET | `/api/caregiver/links` | Get all caregiver links |
| DELETE | `/api/caregiver/link/:id` | Revoke a caregiver link |
| POST | `/api/caregiver/notify` | Send notification to caregivers |
| GET | `/api/caregiver/alerts` | Get alert history |

### Auth (Supabase — client-side)
| Method | Function | Purpose |
|--------|----------|---------|
| - | `signUpWithEmail(email, password)` | Email registration |
| - | `signInWithEmail(email, password)` | Email login |
| - | `signInWithGoogle()` | Google OAuth |
| - | `signOut()` | Logout |

---

## Data Models

### Chat Message
```json
{
  "role": "user" | "assistant",
  "content": "text content",
  "timestamp": "ISO datetime",
  "urgency": "low" | "moderate" | "emergency" | null,
  "isError": false,
  "image": "base64 data URL or null"
}
```

### Hospital
```json
{
  "id": "uuid",
  "name": "Ruby Hall Clinic",
  "address": "Pune, Maharashtra",
  "latitude": 18.53,
  "longitude": 73.88,
  "phone": "+91-20-26163391",
  "specialties": ["Cardiology", "Neurology"],
  "distance_km": 2.5,
  "has_indoor_map": true
}
```

### Department
```json
{
  "id": "uuid",
  "name": "Cardiology",
  "name_hi": "हृदय रोग",
  "name_mr": "हृदयरोग",
  "floor_number": 0,
  "room_number": "G-CARD",
  "doctor_names": ["Dr. A. Sharma"],
  "avg_wait_mins": 25,
  "is_available": true
}
```

### Government Scheme
```json
{
  "id": "uuid",
  "name": "Ayushman Bharat PMJAY",
  "name_hi": "आयुष्मान भारत",
  "description": "...",
  "coverage_amount": 500000,
  "eligibility": "...",
  "states": ["All India"],
  "conditions_covered": ["cancer", "kidney"]
}
```

### User Profile
```json
{
  "name": "string",
  "age": 25,
  "gender": "male" | "female" | "other",
  "state": "Maharashtra",
  "phone": "string",
  "blood_group": "B+",
  "chronic_conditions": ["diabetes"],
  "allergies": ["penicillin"],
  "medications": ["metformin"],
  "language": "en" | "hi" | "mr"
}
```

### Caregiver Link
```json
{
  "id": "uuid",
  "caregiver_name": "string",
  "caregiver_phone": "string",
  "relationship": "family" | "friend" | "doctor",
  "created_at": "ISO datetime"
}
```

### Indoor Map Node
```json
{
  "id": "uuid",
  "label": "Main Entrance",
  "node_type": "entrance" | "department" | "lift" | "stairs" | "waypoint",
  "floor_number": 0,
  "x_pos": 17.7,
  "y_pos": 19.3,
  "department_id": "uuid or null"
}
```

### Indoor Map Edge
```json
{
  "from_node_id": "uuid",
  "to_node_id": "uuid",
  "distance_meters": 15.0,
  "is_accessible": true
}
```

---

## Key UX Requirements

1. **Responsive Design** — Mobile-first (360-430px), but must be fully responsive and look great on:
   - 📱 Mobile phones (360-430px)
   - 📱 Tablets (768-1024px)
   - 💻 Desktops (1024px+)
   - Layout should adapt naturally — single column on mobile, multi-column on desktop where appropriate.
2. **White/Light Theme** — Primary theme is a clean white/light design:
   - White or very light gray backgrounds
   - Professional color accents (blue, green for medical trust)
   - Clean typography with good contrast on light backgrounds
   - Subtle shadows and borders for card/section separation
   - NOT dark mode — the UI should feel bright, clean, and clinical
3. **Multilingual** — ALL user-facing text must support English, Hindi, and Marathi.
4. **PWA** — Installable, works offline for cached features (maps, hospital data).
5. **Accessibility** — Touch-friendly buttons (min 44px), readable fonts, high contrast on white backgrounds.
6. **Indian Context** — Designed for Indian users (₹ currency, Indian states, Hindi/Marathi).
7. **Medical UI** — Should feel trustworthy and professional, not playful. Clean, clinical, hospital-grade aesthetic.
8. **Real-time Feel** — Loading states, skeleton screens, smooth transitions.
9. **Voice-first Option** — Voice input and full voice mode must be prominently accessible.
10. **Emergency UX** — Emergency states must be immediately visible and actionable.

---

## Color Semantics

| Context | Meaning |
|---------|---------|
| 🟢 Green | Low urgency, safe, success, entrance |
| 🟡 Yellow/Amber | Moderate urgency, warning |
| 🔴 Red | Emergency, critical, danger |
| 🔵 Blue | Navigation routes, AI responses, links |
| 🟣 Purple | Processing, loading, special departments |

---

## Voice I/O Architecture

| Feature | Input | Output |
|---------|-------|--------|
| Text chat | Keyboard typing | Text response |
| Mic button (🎤) | Voice → Speech-to-Text | Text response only (NO audio) |
| Voice Mode (🗣️) | Voice → Speech-to-Text | TTS audio response → auto-loops |

---

## Offline Capabilities

- Indoor maps cached in IndexedDB
- Hospital list cached for offline access
- Chat history stored in localStorage
- Service Worker for PWA caching
- Graceful degradation when offline — show cached data with "offline" indicator

---

## LocalStorage Keys Used

| Key | Purpose |
|-----|---------|
| `mediguide_lang` | Selected language (en/hi/mr) |
| `mediguide_patient_name` | User's name |
| `mediguide_patient_age` | User's age |
| `mediguide_patient_gender` | User's gender |
| `mediguide_patient_state` | User's state |
| `mediguide_consent` | DPDPA consent timestamp |
| `mediguide_guest` | Guest mode flag |
