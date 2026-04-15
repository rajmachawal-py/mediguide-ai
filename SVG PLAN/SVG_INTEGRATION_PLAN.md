# Ruby Hall Clinic SVG Floor Plan Integration — Guide

## Is This Complex?

**No.** It's not algorithmically complex — it's just **a lot of data mapping**. The hard parts (BFS routing, offline cache, QR scanning) are already built. What remains is essentially:

1. Insert rooms as nodes + walking paths as edges into the database
2. Render your SVG art instead of the generic dot-and-line view

Think of it as **filling a spreadsheet** (nodes & edges) + **swapping one React component** (SVG renderer).

---

## What Needs to Change (4 things)

### 1️⃣ New Seed SQL — `seed_ruby_hall.sql`
**What:** A SQL file that inserts Ruby Hall Clinic as a hospital, with all its departments, indoor map nodes, and edges.

**How many nodes?** ~35-40 navigable nodes (not every bed — just key areas a patient would navigate TO):

| Floor | Navigable Nodes |
|---|---|
| Ground (0) | Main Entrance, Reception, OPD Registration, Emergency, Cardiology OPD, Radiology, Blood Bank, Pathology, Pharmacy, Cafeteria, Waiting Area, Medical Store, Lifts, Staircase-L, Staircase-R, Admin, Consult Rooms (C01-C06) |
| First (1) | Male Ward, ICU, OT Complex, Female Ward, Medical Store, Private Rooms area, Lifts, Staircase-L, Staircase-R |
| Second (2) | Neurology Ward, Neurosurgery, Oncology, Orthopedics Ward, Urology, Gastroenterology, Private Rooms area, Lifts, Staircase-L, Staircase-R |

**How many edges?** ~50-60 walking paths connecting adjacent rooms through corridors.

**Complexity:** Low — just INSERT statements. I already have the x,y coordinates from your SVGs.

---

### 2️⃣ Updated SVGFloorPlan Component
**What:** Replace the generic dot-and-line renderer with your actual Ruby Hall SVG artwork.

**How it works now:**
```
SVGFloorPlan receives nodes[] → draws circles at x,y → draws lines for edges
```

**How it will work:**
```
SVGFloorPlan receives activeFloor →
  if floor=0 → renders Ground Floor SVG (your artwork)
  if floor=1 → renders First Floor SVG (your artwork)
  if floor=2 → renders Second Floor SVG (your artwork)

On top of the SVG → overlays:
  - Clickable hotspots on each department (invisible rectangles over rooms)
  - Highlighted glow effect on selected department
  - Animated route path (blue glowing line following corridors)
```

**Complexity:** Medium — need to carefully position the route overlay to follow corridors in your SVG. But doable since your SVGs have clear corridor rectangles with known coordinates.

---

### 3️⃣ Updated Navigation Seed Data
**What:** Update the hospital entry in Supabase from "Sassoon General Hospital" to "Ruby Hall Clinic, Pune" (or add as a new hospital).

**What changes:**
- Hospital name, address, coordinates (Ruby Hall is at 18.5362° N, 73.8935° E)
- Department list (matches your SVG rooms)
- Indoor map nodes (x,y from your SVGs)
- Indoor map edges (walking paths)

**Complexity:** Low — just database entries.

---

### 4️⃣ Floor Selector Update
**What:** Currently supports 2 floors (0, 1). Need to add floor 2.

**Complexity:** Trivial — already handled dynamically from seed data.

---

## What Does NOT Change
- ✅ `offlineMapCache.js` — works with any hospital data
- ✅ `QRScanner.jsx` — scans QR → finds node by UUID
- ✅ `navigation_service.py` — BFS works on any graph
- ✅ `IndoorMapPage.jsx` — already handles floor switching, route display
- ✅ Service worker / PWA — unchanged
- ✅ All other features (triage, voice, FHIR, etc.)

---

## Step-by-Step Execution Plan

| Step | What | Time | Files |
|---|---|---|---|
| 1 | Write `seed_ruby_hall.sql` with hospital + departments + nodes + edges | ~5 min | `supabase/seed_ruby_hall.sql` |
| 2 | Rewrite `SVGFloorPlan.jsx` to render your 3 SVG floor plans with interactive overlays | ~10 min | `frontend/src/components/map/SVGFloorPlan.jsx` |
| 3 | Update `DepartmentSearch.jsx` to work with new department names | ~2 min | Already dynamic — no changes needed |
| 4 | Test routing: Entrance → Cardiology, Entrance → ICU (Floor 1), Entrance → Neurology (Floor 2) | ~3 min | Browser testing |

**Total estimated time: ~20 minutes**

---

## How Route Animation Will Look

When a user selects "Cardiology OPD" on the Ground Floor:

```
🟢 Main Entrance (highlighted green — start)
  │
  │ ← animated blue line follows corridor
  │
  ↓
📍 Reception & Registration
  │
  │ ← blue line turns left along corridor
  │
  ↓
🔴 Cardiology OPD (highlighted red — destination, pulsing glow)
```

When a user selects "Neurology Ward" on Floor 2:

```
Ground Floor:
🟢 Main Entrance → Reception → Corridor → 🛗 Lifts

Auto-switches to Floor 2:
🛗 Lifts → Main Corridor → 🔴 Neurology Ward (pulsing glow)
```

The route path will be drawn as a **glowing blue SVG polyline** on top of your floor plan artwork, following the corridors.

---

## How QR Works With This

After implementation, hitting the QR API:
```
GET /api/navigation/ruby-hall-id/qr-codes
```

Returns:
```json
{
  "qr_codes": [
    { "label": "Cardiology OPD", "qr_content": "mediguide://nav/ruby-hall-id/node-cardiology" },
    { "label": "ICU", "qr_content": "mediguide://nav/ruby-hall-id/node-icu" },
    { "label": "Neurology Ward", "qr_content": "mediguide://nav/ruby-hall-id/node-neuro" },
    ...
  ]
}
```

Print any of these → scan → route shows on the real SVG floor plan.

---

## Summary

| Question | Answer |
|---|---|
| Is it complex? | **No** — data mapping + SVG swap |
| How long? | **~20 minutes** |
| Does it break anything? | **No** — all existing features stay intact |
| What's the result? | **Professional floor plan** with animated routing, QR navigation, and offline support for Ruby Hall Clinic |
