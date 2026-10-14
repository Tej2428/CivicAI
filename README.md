# CivicAI — AI-Powered Civic Issue Intelligence Platform
> *Smarter Cities, Faster Solutions.*

CivicAI is a production-oriented civic technology platform designed to transform citizen infrastructure complaints into structured, location-aware intelligence, while providing municipal teams with computer vision triage, explainable risk-based prioritization, duplicate suppression, and work order dispatch tools.

---

## 1. System Architecture & High-Level Design

CivicAI employs a layered, low-cost, scalable architecture:

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide icons.
- **AI Vision Engine**: Google Gemini API (`gemini-3.8-flash`) accessed strictly through a secure server-side endpoint (`/api/analyze-image`).
- **Geographic Mapping**: OpenStreetMap via Leaflet with proximity clustering and an accessible list-view fallback (zero paid API costs).
- **Security & RBAC**: Server-enforced role separation (Citizen, Municipal Officer, Administrator) with protected internal notes.
- **Persistence**: Layered local storage synchronization with complete Firebase Cloud Firestore blueprints (`firebase-blueprint.json`) and security rules (`firestore.rules`).

```
+-------------------------------------------------------------------------+
|                              CIVIC CLIENT                               |
|  [Citizen Portal]       [Officer Command]        [Admin SLA Policy]     |
+-------------------------------------------------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
|  /api/analyze-image   |                       | /api/system-status    |
|  - Gemini 3.8 Flash   |                       | - API Health & Model  |
|  - JSON Schema Triage |                       | - Uptime & Config     |
+-----------------------+                       +-----------------------+
            |
            v
+-------------------------------------------------------------------------+
|                        PERSISTENCE & SECURITY                           |
|  - 4-Factor Explainable Priority Engine                                |
|  - Haversine Geospatial Duplicate Detection (150m Radius)               |
|  - Immutable Municipal Audit Trail & In-App Alerts                      |
+-------------------------------------------------------------------------+
```

---

## 2. Core Functional Capabilities

### A. Citizen Complaint Reporting (5-Step Wizard)
1. **Photograph Capture**: Upload from device or capture via camera. Client-side size & MIME validation with inline compression preview.
2. **Issue Information**: 8 standardized categories, citizen problem description, and optional landmarks.
3. **Location Selection**: Device GPS coordinate lock with accuracy tolerances, quick municipal presets, or manual street address entry.
4. **AI Vision Triage**: Server-side Gemini image triage extracting physical evidence, safety concerns, recommended severity (0–100), and human-review flags.
5. **Duplicate Check & Submission**: Instant geospatial query identifies nearby active tickets within 150m, allowing the citizen to review existing work orders or proceed with a unique complaint ID (`CIVIC-YYYY-XXXXX`).

### B. Explainable Priority Scoring Engine
Complaints are ranked using four normalized factors (0 to 100):

$$\text{Priority Score} = 0.40 \times \text{Severity} + 0.30 \times \text{Safety Risk} + 0.20 \times \text{Duration} + 0.10 \times \text{Nearby Frequency}$$

- **Critical**: 80–100 (Immediate 24h municipal target SLA, automated engineer review flag).
- **High**: 60–79 (48h response SLA).
- **Medium**: 30–59 (96h response SLA).
- **Low**: 0–29 (168h scheduled maintenance).

*Ethics Commitment: Priority scoring strictly evaluates physical infrastructure risk. Caste, religion, gender, income, or demographic attributes are never collected or processed.*

### C. Municipal Officer Command Dashboard
- Real-time KPI summaries: Total complaints, new unassigned, pending work orders, critical hazards, and overdue tickets.
- Filterable data grid by category, status, priority band, and location.
- Multi-action work order modal: team assignment, status transitions (`Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Assigned` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved` $\rightarrow$ `Closed`), internal engineering notes, and verified resolution photo evidence.

### D. OpenStreetMap & Hotspot Analytics
- Interactive map markers colored by priority band with interactive defect popups.
- Neighborhood clustering algorithms identifying repeat failure areas.
- Category distribution charts and SLA resolution time calculations.

---

## 3. Configuration & Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for live vision inference | Injected by AI Studio |
| `GEMINI_MODEL` | Target vision model | `gemini-3.8-flash` |
| `PORT` | Local dev/production server port | `3000` |

*Security note: `GEMINI_API_KEY` is only read server-side in `server/geminiService.ts` and is never exposed in client bundles.*

---

## 4. Running the Application & Automated Tests

### Development Mode
```bash
npm run dev
```
Starts the full-stack Vite server on port 3000 with the `/api` middleware mounted.

### Automated Test Suite
To verify complaint ID generation, priority math, Haversine duplicate logic, and RBAC transitions:
```bash
npm test
```

### Production Build & Deployment
```bash
npm run build
npm start
```

---

## 5. Demo Environment & Fictional Dataset

The application includes 16 realistic fictional seed complaints across all 8 supported categories in a metropolitan area (Central Ward, West End, Riverside, North Park, Old Quarter). Several pairs of reports (e.g. `CIVIC-2026-A1092` and `CIVIC-2026-B8841`) are deliberately positioned in close proximity (35m) to demonstrate duplicate detection.

Competition judges can instantly switch between **Citizen**, **Municipal Officer**, and **Administrator** personas using the top evaluator bar.
