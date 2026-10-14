# CivicAI — AI-Powered Civic Issue Intelligence Platform

> **Tagline:** *Smarter Cities, Faster Solutions.*  
> **Competition Track:** Technology Innovation & Public Infrastructure Modernization  
> **Version:** 1.0.0 (Production-Oriented Edition)

CivicAI is a comprehensive, production-oriented civic technology platform designed to transform unstructured citizen infrastructure complaints into verified, location-aware intelligence. It provides municipal authorities with computer vision triage, explainable risk-based prioritization, duplicate suppression, and an authenticated municipal command dashboard.

---

## 1. Executive Summary & Problem Context

Municipalities face chronic operational challenges in public infrastructure management:
- **Citizen Friction**: Reporting road potholes, leaking mains, broken streetlights, or waste overflow is often convoluted across disparate departments with zero tracking transparency.
- **Triage Overload**: Municipal call centers receive thousands of duplicate complaints during weather incidents or peak hours without automated categorization or severity triage.
- **Priority Blindspots**: Traditional "first-come, first-served" queues fail to escalate acute public-safety hazards (such as exposed electrical cables in a children's park or a road crater in an arterial bus lane).
- **Resource Constraints**: Municipalities operate under tight budget constraints, necessitating low-cost architectures that avoid expensive commercial mapping or heavy cloud lock-in.

**CivicAI solves this end-to-end** by pairing client-side mobile accessibility with server-side Google Gemini computer vision triage, explainable multi-factor scoring, proximity-based duplicate suppression, and a zero-cost OpenStreetMap visualization layer.

---

## 2. System Architecture & Tech Stack

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT APPLICATION                                 |
|                                                                                       |
|   +-----------------------+   +--------------------------+   +--------------------+   |
|   |    Citizen Portal     |   | Municipal Command Center |   | Admin SLA Console  |   |
|   | (5-Step Photo Wizard, |   |  (KPI Metrics, Dispatch, |   | (Dynamic Weights,  |   |
|   |  Tracking, Timeline)  |   |   Resolution Evidence)   |   |  RBAC, Audit Logs) |   |
|   +-----------------------+   +--------------------------+   +--------------------+   |
|               |                             |                           |             |
|   +-------------------------------------------------------------------------------+   |
|   |                 React 19 + TypeScript + Tailwind CSS v4 + Leaflet             |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
                                            |
                                            v  HTTP / REST
+---------------------------------------------------------------------------------------+
|                               FULL-STACK SERVER RUNTIME                               |
|                                                                                       |
|   +----------------------------+                     +----------------------------+   |
|   |    /api/analyze-image      |                     |    /api/system-status      |   |
|   |   Server-Side Gemini SDK   |                     |  API Health, Key Presence, |   |
|   |  (Schema-Constrained JSON) |                     |   Uptime & Model Metadata  |   |
|   +----------------------------+                     +----------------------------+   |
|                 |                                                                     |
|                 v                                                                     |
|   +-------------------------------------------------------------------------------+   |
|   |                   Google Gemini 3.8 Flash Vision Model                       |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                               PERSISTENCE & SECURITY LAYER                            |
|                                                                                       |
|   +--------------------------+   +------------------------+   +-------------------+   |
|   | Explainable Priority Eng |   | Haversine Duplicate Eng|   |  Audit Trail &    |   |
|   | (4-Factor Math Formula)  |   | (150m Proximity Query) |   |  In-App Alerts    |   |
|   +--------------------------+   +------------------------+   +-------------------+   |
|   +-------------------------------------------------------------------------------+   |
|   |   Cloud Firestore Blueprint (firebase-blueprint.json) + Rules (firestore.rules)|   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

### Technology Matrix
- **Frontend Framework**: React 19, TypeScript, Tailwind CSS v4
- **Icons & Typography**: Lucide React, Plus Jakarta Sans, JetBrains Mono
- **AI Vision Engine**: `@google/genai` TypeScript SDK (`gemini-3.8-flash`)
- **Backend Runtime**: Node.js, Express, Vite Dev Middleware
- **Geographic Mapping**: Leaflet & OpenStreetMap (No paid API keys required)
- **Database Architecture**: Cloud Firestore schemas (`firebase-blueprint.json`) with server-enforced security rules (`firestore.rules`)
- **Testing Engine**: Automated TypeScript test runner (`npm test`)

---

## 3. End-to-End User Workflows

### A. Citizen Experience
1. **Photo Capture**: Citizen selects a file or opens the device camera with client-side validation (max 10MB, JPEG/PNG/WebP).
2. **Issue Details**: Citizen chooses from 8 standardized municipal categories, inputs description, and provides optional landmarks.
3. **Location Lock**: Coordinates are captured via device GPS (with accuracy verification) or manually selected via quick municipal presets.
4. **AI Triage Verification**: Server-side Gemini vision analyzes physical evidence, calculates preliminary severity, and checks for acute safety hazards.
5. **Duplicate Check & Submission**: Instant geospatial query checks active tickets within 150m. If clear, a unique non-sequential ID (`CIVIC-YYYY-XXXXX`) is generated and tracked on a real-time status timeline.

### B. Municipal Officer Experience
1. **Authenticated Command Dashboard**: Real-time KPI summaries displaying new submissions, active work orders, overdue SLAs, and safety alerts.
2. **Search & Multi-Filter Grid**: Search by ticket ID, location, or keyword; filter by priority band or SLA deadline.
3. **Triage & Dispatch Drawer**: Assign complaints to specialized directorates (Roads & Bridges, Sanitation, Water & Sewage, Electrical, Urban Parks, Rapid Response).
4. **Protected Internal Notes**: Engineers log field measurements, contractor permits, and utility coordination shielded from public views.
5. **Resolution Certification**: Officers certify completion by uploading photo evidence, resolution notes, and verified inspection method before transitioning tickets to `Resolved`.

### C. Administrator Experience
1. **Algorithmic Weight Calibration**: Adjust the 4 factor weights (Severity, Safety Risk, Duration, Frequency) in real-time.
2. **SLA Policy Management**: Configure target resolution windows in hours (Critical: 24h, High: 48h, Medium: 96h, Low: 168h).
3. **Duplicate Threshold Tuning**: Adjust the geospatial matching radius (50m to 500m).
4. **Immutable Audit Trail**: Review every status update, department dispatch, and config change with actor identity and timestamps.

---

## 4. Google Gemini Vision Engine Integration

Image analysis is executed strictly **server-side** (`server/geminiService.ts`) to ensure that API keys are never exposed in browser bundles.

### Response Schema Specification
```json
{
  "category": "Pothole or damaged road",
  "visibleEvidence": "Asphalt crater with exposed sub-base aggregate measuring ~14cm depth in travel lane.",
  "severity": "critical",
  "severityScore": 92,
  "publicSafetyRiskScore": 88,
  "publicSafetyConcerns": "High risk of vehicle wheel destruction and two-wheeler wipeout on arterial road.",
  "suggestedSeverityReasoning": "Depth exceeds 10cm threshold on 35mph roadway; requires emergency cold patch.",
  "isUnclearOrIrrelevant": false,
  "recommendedHumanReview": true,
  "modelConfidenceNotes": "Confidence high based on sharp visual edge degradation and gravel pattern."
}
```

### Demo Mode & Fallback Resilience
If `GEMINI_API_KEY` is not present in the runtime environment:
- The system automatically engages a rule-based demo triage simulator.
- The interface transparently displays: `"DEMO MODE SIMULATOR: Configure GEMINI_API_KEY in Secrets for live Gemini 3.8 Flash inference."`
- The application never fakes AI connection or hallucinates arbitrary scores.

---

## 5. Explainable Priority Scoring Engine

Priority scores are computed deterministically using four normalized factors (0 to 100):

$$\text{Priority Score} = 0.40 \times \text{Severity} + 0.30 \times \text{Public Safety Risk} + 0.20 \times \text{Unresolved Duration} + 0.10 \times \text{Nearby Frequency}$$

### Contributing Factors
1. **Physical Severity (40%)**: Derived from computer vision measurement of physical defect scale (depth, spalling, volume).
2. **Public Safety Risk (30%)**: Evaluates hazard severity (electrocution risk, pedestrian fall, flooding into residences).
3. **Unresolved Duration (20%)**: Non-linear escalation based on hours elapsed since initial report:
   $$\text{Duration Score} = \min\left(100, \frac{\text{Elapsed Hours}}{168} \times 100\right)$$
4. **Nearby Report Frequency (10%)**: Cluster score based on active complaints reported in the same vicinity within 30 days.

### Demonstration Bands & SLAs
- **Critical (80–100)**: 24-Hour Municipal SLA. Automatically flags ticket for immediate engineer verification.
- **High (60–79)**: 48-Hour Municipal SLA.
- **Medium (30–59)**: 96-Hour Municipal SLA.
- **Low (0–29)**: 168-Hour Municipal SLA.

> **Ethics Commitment:** Priority scoring relies strictly on physical infrastructure risk factors. Caste, religion, gender, income, or personal demographics are never collected or factored into prioritization.

---

## 6. Geospatial Duplicate Detection Engine

Duplicate detection operates via a two-stage filter:

1. **Haversine Distance Filter**:
   $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
   Where $R = 6,371,000\text{ m}$. Reports within the configurable threshold (default 150m) are flagged.

2. **Text Token Similarity**:
   Jaccard word-token overlap calculated across descriptions and landmarks to identify matching descriptions.

When duplicates are identified, the citizen is prompted with existing ticket details and given the choice to track the existing issue or proceed with their submission.

---

## 7. Role-Based Access Control & Security

### Status State Machine
Official transitions are enforced according to strict municipal hierarchy:

| Current Status | Allowed Transitions | Permitted Roles |
| :--- | :--- | :--- |
| `Submitted` | `Under Review`, `Assigned`, `Closed` | Officer, Admin |
| `Under Review` | `Assigned`, `In Progress`, `Closed` | Officer, Admin |
| `Assigned` | `In Progress`, `Under Review`, `Closed` | Officer, Admin |
| `In Progress` | `Resolved`, `Assigned` | Officer, Admin |
| `Resolved` | `Closed`, `In Progress` (Reopen) | Officer, Admin |
| `Closed` | `In Progress` (Reopen) | Admin |

*Citizens are restricted from modifying statuses, accessing internal notes, or viewing private information of other citizens.*

### Firestore Security Rules (`firestore.rules`)
- **Public Read**: Complaint summaries are readable by the public without exposing citizen contact details.
- **Authenticated Write**: Only verified citizens can create complaints with `status == 'Submitted'`.
- **Protected Subcollection**: `/reports/{id}/internal_notes` is strictly restricted to officers and admins.
- **Immutable Audit**: `/audit_logs` entries can only be created, never edited or deleted.

---

## 8. Configuration & Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Environment Variable | Description | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for live vision triage | Injected by AI Studio |
| `GEMINI_MODEL` | Gemini vision model identifier | `gemini-3.8-flash` |
| `PORT` | Local dev and production server port | `3000` |
| `APP_URL` | Base application URL | Auto-injected |

---

## 9. Installation, Testing & Deployment

### Run Locally (Development)
```bash
# Install dependencies
npm install

# Start Vite server with backend API middleware mounted on port 3000
npm run dev
```

### Automated Unit Test Suite
CivicAI includes an automated test runner (`src/tests/civic.test.ts`) validating core domain logic:
```bash
npm test
```
**Test Coverage:**
1. Unique non-sequential complaint ID generation (`CIVIC-YYYY-XXXXX`).
2. Priority score formula calculations, dangerous condition review flags, and bands.
3. Unresolved duration scaling and cluster frequency scoring.
4. Haversine distance calculations and duplicate report matching.
5. Role-based status transition restrictions (citizen vs. officer).
6. Text token Jaccard similarity algorithms.

### Production Build & Deployment
```bash
# Build production bundle
npm run build

# Start full-stack Node.js server
npm start
```

---

## 10. Demo Environment & Fictional Dataset

CivicAI includes **16 realistic fictional seed complaints** across 5 municipal districts (Central Ward, Downtown East, West End, North Park, Riverside Ward) covering all 8 supported infrastructure categories:
- **Road Damage / Potholes**: Critical road crater (`CIVIC-2026-A1092`) and proximate duplicate (`CIVIC-2026-B8841`) located 35m away on Oak Street.
- **Solid Waste**: Market dumpster overflow (`CIVIC-2026-C4419`) and duplicate alleyway spill (`CIVIC-2026-C9923`) located 48m away.
- **Blocked Drainage**: Pine Boulevard intersection flood resolved with verified hydro-vac evidence (`CIVIC-2026-D3201`).
- **Damaged Streetlight**: Knocked streetlight with exposed electrical wires in children's park (`CIVIC-2026-E7152`).
- **Water Main Burst**: Pressurized potable line rupture outside elementary school (`CIVIC-2026-F1990`).
- **Damaged Sidewalk**: Concrete upheaval outside public library (`CIVIC-2026-G8211`) and secondary duplicate (`CIVIC-2026-G8229`).
- **Bridge Guardrail**: Failed canal pedestrian guardrail with 4.5m drop hazard (`CIVIC-2026-H4012`).

### Quick Evaluator Persona Switcher
Competition judges can instantly test all three user roles using the top evaluator bar:
- **Citizen Persona**: Teja Sharma (Submit complaints, view timeline, receive in-app notifications).
- **Officer Persona**: Officer Rajesh Kumar (Triage complaints, assign teams, record resolution proofs).
- **Administrator Persona**: Sarah Chen (Adjust priority weights, modify SLA hours, audit logs).
- **Reset Seed Data Button**: One-click reset restores the seed dataset to initial state at any time.

---

## 11. Known Limitations & Roadmap

- **Push Notifications / SMS**: Currently implemented as in-app notifications. Web Push API and Twilio SMS gateway can be connected by adding webhook credentials.
- **Live Video Streaming**: Real-time video inspection via WebRTC is architecturally supported and ready for mobile field worker dispatch integration.
