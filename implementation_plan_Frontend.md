# Frontend Redesign: "Clinical Intelligence" Design System

Replace the current dark-mode glassmorphism frontend with the Stitch "Clinical Intelligence" design system — a **light-mode, editorial-healthcare** aesthetic inspired by the "Digital Surgeon" persona.

## User Review Required

> [!IMPORTANT]
> **This is a MASSIVE overhaul** — every single page, component, and the entire CSS design system will change. The app will go from dark-mode glass to light-mode clinical white.

> [!WARNING]
> **Zero backend changes.** All API endpoints, hooks, services, contexts, and state management remain 100% untouched. Only `.jsx` files in `/pages`, `/components`, and CSS/Tailwind configs change.

> [!CAUTION]
> **Mobile-first is maintained.** The Stitch designs are desktop (1280px), but our app is primarily mobile. I will adapt the Stitch design tokens (colors, typography, spacing, components) to the existing mobile-first layout rather than force a desktop layout onto a mobile app.

---

## Design System Extracted from Stitch

### Color Palette (Light Mode)
| Token | Value | Usage |
|---|---|---|
| `primary` | `#00478D` | Trust Anchor — nav, CTAs, links |
| `primary-container` | `#005EB8` | Primary actions, buttons |
| `secondary` | `#7043C2` | AI Intelligence — AI insights |
| `secondary-container` | `#A97DFF` | AI highlights |
| `tertiary` | `#00541A` | Clinical Validation — success states |
| `tertiary-container` | `#006F25` | Positive indicators |
| `error` | `#BA1A1A` | Emergency red |
| `surface` | `#F8F9FA` | Main background |
| `surface-container` | `#EDEEEF` | Section backgrounds |
| `surface-container-low` | `#F3F4F5` | Large content areas |
| `surface-container-high` | `#E7E8E9` | Interactive modules |
| `on-surface` | `#191C1D` | Primary text (never pure black) |
| `outline` | `#727783` | Subtle borders |
| `outline-variant` | `#C2C6D4` | Ghost borders |

### Typography
- **Headlines:** Manrope (Google Font)
- **Body/Labels:** Inter (already in use)
- **Label-SM:** ALL-CAPS with +5% letter-spacing for metadata

### Shape
- Roundness: `0.75rem` (12px) for most components
- No 1px solid borders — use background color shifts instead

### Elevation
- **"Clinical Bloom" shadow:** `0 20px 40px rgba(0,71,141,0.06)` (blue-tinted)
- **Glass:** `surface-container-lowest` at 85% opacity + 24px backdrop-blur

### Key Design Rules
1. **No-Line Rule:** No 1px borders for sectioning — use background shifts
2. **"Space is Safety":** Generous whitespace
3. **Never use pure black text** — always `#191C1D`
4. **Rounded edges** (medical safety metaphor)

---

## Proposed Changes

### Phase 1: Design Tokens & Infrastructure

#### [DONE] [tailwind.config.js](./frontend/tailwind.config.js)
- Replace dark-mode color palette with Clinical Intelligence colors
- Add `manrope` font family for headlines
- Update animation keyframes
- Add tonal surface tokens

#### [DONE] [index.css](./frontend/src/index.css)
- Switch body from dark gradient to light `#F8F9FA` background
- Remove all dark glassmorphism utilities (`.glass`, `.glass-light`, `.glass-card`)
- Add new Clinical Intelligence component classes:
  - `.clinical-card` (white card with blue-tinted shadow)
  - `.clinical-glass` (85% opacity white + backdrop-blur)
  - `.ai-pulse` (secondary gradient for AI elements)
  - Urgency badges with 10% opacity backgrounds
  - Chat bubbles: primary blue for user, white card for AI
  - Editorial typography scale

#### [DONE] [index.html](./frontend/index.html)
- Add Manrope Google Font import

---

### Phase 2: Shared Components

#### [DONE] [Navbar.jsx](./frontend/src/components/shared/Navbar.jsx)
- White/surface background with blue-tinted shadow
- Primary blue icons and text
- Active tab indicator in primary color

#### [MODIFY] [ConsentModal.jsx](./frontend/src/components/shared/ConsentModal.jsx)
- Clinical Glass overlay (white at 85% + backdrop-blur)
- Editorial typography for DPDPA consent
- Primary blue CTA buttons
- Shield icon with tertiary (green) accent

#### [MODIFY] [ProfileOnboarding.jsx](./frontend/src/components/shared/ProfileOnboarding.jsx)
- White modal with Clinical Bloom shadow
- Primary-color bottom-stroke inputs (prescription line style)
- Step indicators in primary color
- Clean Manrope headlines

#### [DONE] [DisclaimerBanner.jsx](./frontend/src/components/shared/DisclaimerBanner.jsx)
- Surface-container-low background
- Subtle primary-fixed text highlight

#### [DONE] [EmergencyAlert.jsx](./frontend/src/components/shared/EmergencyAlert.jsx)
- Error red with 10% opacity background (soft clinical badge)
- White card with error border accent

#### [DONE] [Spinner.jsx](./frontend/src/components/shared/Spinner.jsx)
- Primary blue spinner on white background

---

### Phase 3: Chat Components (MOST IMPORTANT)

#### [DONE] [ChatBubble.jsx](./frontend/src/components/chat/ChatBubble.jsx)
- **User bubble:** Solid primary (`#005EB8`) with white text, rounded 20px
- **AI bubble:** White card (`surface-container-lowest`) with Clinical Bloom shadow, `on-surface` text
- Timestamp in `Label-SM` style (caps, letter-spaced)

#### [DONE] [ChatInput.jsx](./frontend/src/components/chat/ChatInput.jsx)
- White input with surface-variant background
- Primary bottom-stroke on focus (prescription line)
- Primary-colored send button

#### [DONE] [UrgencyBanner.jsx](./frontend/src/components/chat/UrgencyBanner.jsx)
- Clinical triage badges: error/tertiary with 10% opacity backgrounds
- Soft, professional appearance

#### [DONE] [VoiceButton.jsx](./frontend/src/components/chat/VoiceButton.jsx)
- Primary outline button with microphone icon
- Recording state: secondary (AI purple) pulse animation

#### [DONE] [ImageUploadButton.jsx](./frontend/src/components/chat/ImageUploadButton.jsx)
- Ghost button style, primary text color

#### [MODIFY] [VoiceAutoModeOverlay.jsx](./frontend/src/components/chat/VoiceAutoModeOverlay.jsx)
- Clinical Glass overlay (white backdrop-blur)
- AI Pulse gradient for active recording

#### [MODIFY] [SchemeRecommendation.jsx](./frontend/src/components/chat/SchemeRecommendation.jsx)
- White expandable cards with tertiary (green) accent
- Clinical Bloom shadow on expansion

---

### Phase 4: Pages

#### [DONE] [LoginPage.jsx](./frontend/src/pages/LoginPage.jsx)
- Split layout: left editorial panel + right login form
- Manrope headline "The Digital Surgeon's Portal"
- AI Pulse gradient accent strip
- Clean white form cards
- Google OAuth + Email buttons with primary styling

#### [DONE] [ChatPage.jsx](./frontend/src/pages/ChatPage.jsx)
- White background with surface-container header
- "Encrypted Session" badge in outline
- Clinical AI chat interface
- Floating input bar at bottom with Clinical Glass

#### [DONE] [HospitalPage.jsx](./frontend/src/pages/HospitalPage.jsx)
- Map + hospital list with white cards
- Filter chips in primary-fixed color
- Distance/rating badges

#### [MODIFY] [IndoorMapPage.jsx](./frontend/src/pages/IndoorMapPage.jsx)
- White container for SVG floor plans
- Primary-colored route paths
- Tertiary destination markers

#### [MODIFY] [CaregiverDashboard.jsx](./frontend/src/pages/CaregiverDashboard.jsx)
- Editorial layout with Manrope headlines
- Patient cards in surface-container-lowest (white)
- Alert badges with triage colors
- Data chips on surface-container-high

#### [MODIFY] [ProfilePage.jsx](./frontend/src/pages/ProfilePage.jsx)
- Clean white cards for each profile section
- Primary bottom-stroke inputs
- Tertiary accent for verified data
- DPDPA section with outline-variant borders

#### [MODIFY] [PrivacyPolicyPage.jsx](./frontend/src/pages/PrivacyPolicyPage.jsx)
- Editorial long-form layout
- Manrope section headers
- Inter body text
- Legal sections with surface-container backgrounds

---

## What Will NOT Change

- **All backend files** — zero modifications
- **All hooks** (`useChat.js`, `useGeolocation.js`, `useVoiceAutoMode.js`)
- **All services** (`api.js`, `supabase.js`, `sarvam.js`, `healthCardGenerator.js`, `fhirExport.js`)
- **All contexts** (`LanguageContext.jsx`)
- **Routing structure** in `App.jsx`
- **State management logic**
- **API endpoints and data flow**

---

## Verification Plan

### Build Verification
```bash
cd frontend && npm run build
```
Must produce zero errors.

### Visual Verification
- Open each page in browser and compare against Stitch screenshots
- Verify mobile responsiveness at 360px

### Functional Verification
- Login flow (email + Google OAuth) still works
- Consent → Onboarding → Chat flow intact
- Chat messages send/receive correctly
- Voice input/output still functional
- Hospital finder loads map + list
- Indoor navigation renders SVG
- Caregiver dashboard shows patient data
- Profile edit/save works
- Health card PDF generation works
- FHIR export works
