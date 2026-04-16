# Gemini-Powered Hospital & Scheme Recommendations — Full Plan

## The Idea

After triage completes, instead of showing hardcoded schemes or static hospital lists, **Gemini AI analyzes the patient's triage result** and recommends:
1. The **best matching government health schemes** (from our database)
2. The **nearest hospital** with the right specialty (from our database)

This makes the system feel intelligent — not just a list, but a **personalized healthcare navigator**.

---

## How It Works (Step by Step)

```
Patient chats → AI triage → Result: "Moderate chest pain, likely cardiac"
                                    ↓
                        Gemini Recommendation Engine
                                    ↓
                    ┌───────────────┴───────────────┐
                    │                               │
            🏥 Hospital Match              📋 Scheme Match
            "Ruby Hall Clinic"             "Ayushman Bharat"
            "Cardiology dept,             "Covers cardiac treatment
             Floor G, Room G-CARD"         up to ₹5 lakh"
                    │                               │
                    └───────────┬───────────────────┘
                                ↓
                    Shows recommendation card in chat
                    + "Navigate to hospital" button
```

---

## Complete User Flow (Demo Scenario)

### Step 1: Patient starts chat
> Patient: "mujhe seene mein dard ho raha hai" (I have chest pain)

### Step 2: AI triage runs (existing feature)
> AI: Asks follow-up questions → Produces triage result:
> - **Condition:** Suspected cardiac issue
> - **Severity:** Moderate
> - **Specialty needed:** Cardiology

### Step 3: Gemini Recommendation triggers (NEW)
> System internally does:
> 1. Queries `hospitals` table → finds hospitals with `cardiology` specialty near patient
> 2. Queries `schemes` table → finds schemes covering cardiac treatment
> 3. Sends both lists to Gemini with the triage context
> 4. Gemini returns natural-language recommendation

### Step 4: Recommendation card appears
> **🏥 Recommended Hospital**
> Ruby Hall Clinic (4.4★) — 2.3 km away
> Cardiology & Cardiac Surgery — Dr. P. Herlekar
> Avg wait: 30 mins
> [🗺️ Navigate Inside Hospital]  ← Opens indoor SVG map!
>
> **📋 Eligible Schemes**
> • Ayushman Bharat (PMJAY) — Covers up to ₹5 lakh
> • Mahatma Phule Jan Arogya Yojana — Free cardiac treatment

---

## Edge Cases & What Happens

### Edge Case 1: Patient is near Ruby Hall Clinic
- **What happens:** Gemini recommends Ruby Hall
- **Indoor Map:** ✅ Full SVG floor plan with room-level navigation
- **Result:** Patient can click "Navigate" → sees Ground Floor → Cardiology OPD at room G-CARD with animated route
- **This is the BEST demo scenario** 🎯

### Edge Case 2: Patient is near a DIFFERENT hospital (e.g., KEM, Jehangir)
- **What happens:** Gemini recommends that closer hospital
- **Indoor Map:** Shows the generic dot-and-line graph (from existing `seed_indoor_map_all.sql`)
- **Result:** Still functional navigation, just not the professional SVG
- **For demo:** This is fine — explain "we built the detailed map for our partner hospital (Ruby Hall), other hospitals use basic maps"

### Edge Case 3: No hospital nearby has the specialty
- **What happens:** Gemini says "The nearest hospital with [specialty] is [hospital], [X km] away"
- **Indoor Map:** May or may not have map data
- **Result:** Works fine — just no indoor navigation for that hospital
- **Gemini handles this gracefully** with a natural response

### Edge Case 4: Patient is a Guest (no location)
- **What happens:** System uses browser geolocation (already implemented)
- **If geolocation denied:** Shows all Pune hospitals, sorted by rating
- **Result:** Still works — just less precise

### Edge Case 5: No matching scheme for the condition
- **What happens:** Gemini says "No specific government scheme matches, but you may check with the hospital's billing department for financial assistance"
- **Result:** Professional and honest — doesn't show empty lists

### Edge Case 6: Emergency triage (chest pain, stroke, etc.)
- **What happens:** Emergency alert triggers FIRST (existing feature), then scheme/hospital shows with "EMERGENCY" tag
- **Indoor Map:** If Ruby Hall → routes to EMERGENCY department on Ground Floor
- **Result:** Life-saving feature — "Nearest emergency: Ruby Hall, 2.3 km, call 108"

---

## About the SVG Indoor Map (Ruby Hall Only)

### Q: "We only have SVG for Ruby Hall — is that a problem?"
**No! It's actually the PERFECT demo story.**

During hackathon, explain it like this:
> "We partnered with Ruby Hall Clinic as our pilot hospital. We created a detailed, interactive floor plan with 40+ navigable nodes across 3 floors. For the MVP, we demonstrate the full navigation experience at Ruby Hall. Other hospitals use our basic graph navigation, and as we onboard more hospitals, we add their SVG layouts."

This is exactly how real apps like Google Maps work — they don't have indoor maps for every building, just the ones they've mapped.

### What happens in the demo:

| If Gemini recommends... | Indoor Map Experience |
|---|---|
| **Ruby Hall Clinic** | ✅ Professional SVG with rooms, corridors, animated route |
| **Other Pune hospitals** | ⚠️ Basic graph view (dots + lines) — still functional |
| **Hospital with no map** | Shows "Indoor map not yet available" message |

### How to FORCE Ruby Hall in demo:
During the hackathon demo, just set your location near Ruby Hall (Sangamvadi, Pune). The system will naturally recommend Ruby Hall as the nearest hospital with the needed specialty.

---

## What Gemini Receives (Prompt)

```
You are a healthcare navigator for India. Based on the patient's triage result,
recommend the best hospital and eligible government health schemes.

PATIENT TRIAGE:
- Condition: {triage.condition}
- Severity: {triage.severity}  
- Specialty needed: {triage.specialty}
- Patient location: {lat}, {lng}
- Patient state: {patient.state}

AVAILABLE HOSPITALS (nearest first):
{hospitals_json}

AVAILABLE SCHEMES:
{schemes_json}

Respond with:
1. The single best hospital recommendation with reason
2. Up to 3 eligible schemes with brief eligibility note
3. Keep it short, warm, and actionable (2-3 sentences per item)
```

---

## What We Need to Build

| # | Task | Effort | File |
|---|---|---|---|
| 1 | Backend endpoint: `POST /api/triage/recommend` | 10 min | `backend/app/routers/triage.py` |
| 2 | Gemini prompt for recommendations | 5 min | `backend/app/prompts/recommend_prompt.txt` |
| 3 | Frontend recommendation card component | 10 min | `frontend/src/components/chat/RecommendationCard.jsx` |
| 4 | Hook into ChatPage after triage completes | 5 min | `frontend/src/pages/ChatPage.jsx` |

**Total: ~30 minutes**

---

## Is This Professional?

| Criteria | Answer |
|---|---|
| Feasible? | ✅ Yes — just one Gemini call + 2 DB queries |
| Professional? | ✅ Very — AI-powered personalization, not hardcoded |
| Hackathon-worthy? | ✅ Strong differentiator — most teams hardcode this |
| Scalable? | ✅ Add more hospitals/schemes to DB, Gemini adapts automatically |
| Compliant? | ✅ No diagnosis — just navigation + information |
| Breaks anything? | ❌ No — purely additive feature on top of existing triage |

---

## Summary

- **Gemini triggers ONLY after triage** → no random suggestions
- **Ruby Hall gets the BEST experience** → full SVG indoor navigation
- **Other hospitals still work** → basic map or "map unavailable" message
- **Schemes are personalized** → based on condition + patient state
- **30 minutes to build** → high impact, low effort
