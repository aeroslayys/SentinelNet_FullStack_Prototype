# SentinelNet — Full-Stack Hackathon Prototype

A runnable MVP for **SentinelNet: Multi-Layer Social Media Intelligence & Network Analysis**. The UI keeps the dark navy/cyan styling from the SentinelNet pitch deck while implementing an end-to-end demonstrable workflow.

## What works

- React operator dashboard
- Express REST API
- API security/utility middleware: Helmet, CORS, rate limiting, JSON limits, request IDs, Morgan logging, query validation, centralized errors
- Synthetic multilingual social-media feed
- Search and risk filters
- Threat scoring and narrative escalation metrics
- Coordinated inauthentic behavior / bot-cluster graph using D3
- Interactive node inspector with bot score, centrality, cluster and synced-post count
- Demo-event injection for judging
- SHA-256 evidence hashing on the backend
- Evidence verification endpoint
- Simulated permissioned-ledger workflow
- JSON threat-report export

> **Scope:** This prototype uses synthetic data. It does not scrape real users or connect to a production social-media API. The Hyperledger Fabric step is deliberately represented as a local audit-ledger simulation; the hashing itself is real SHA-256.

---

## Current development milestone — MongoDB + NLP foundation

The `feature/mongo-nlp-foundation` branch begins replacing pre-classified demo intelligence with a real processing pipeline.

### What changed

- Raw posts are now stored without hardcoded sentiment/risk/category values.
- A repository layer supports either:
  - `DATA_SOURCE=memory` for zero-setup development, or
  - `DATA_SOURCE=mongodb` for persistent MongoDB storage.
- `POST /api/posts` accepts new raw posts.
- `POST /api/analyze` sends raw text to a separate FastAPI NLP service.
- The NLP service performs multilingual sentiment inference using a configurable Hugging Face transformer baseline, plus language detection, urgency/manipulation/claim signals and narrative extraction.
- The Express API combines NLP output with graph/bot signals to calculate a real runtime risk score.
- Evidence records are created only after analysis and use real SHA-256 hashing.
- The dashboard now reports whether the NLP service is using the transformer or a transparent heuristic fallback.

### New architecture

```text
Raw post / demo event
        ↓
Express ingestion API
        ↓
MongoDB or memory repository
        ↓
FastAPI NLP service
        ↓
sentiment + language + urgency + narrative
        ↓
Express risk engine + graph signal
        ↓
persist analysis
        ↓
React dashboard / alerts / evidence
```

### Install the new services

Node dependencies:

```bash
npm run install:all
```

Python NLP service:

```bash
cd ml-service
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Linux/macOS:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

Run the NLP service:

```bash
uvicorn app.main:app --reload --port 8000
```

Then, from the project root, run the frontend and Express API:

```bash
npm run dev
```

Or, once the Python environment is active, run all three processes together:

```bash
npm run dev:full
```

### Optional MongoDB persistence

The default is still zero-setup memory mode. To enable MongoDB, create `backend/.env`:

```env
DATA_SOURCE=mongodb
MONGODB_URI=mongodb://127.0.0.1:27017/sentinelnet
AUTO_SEED=true
ML_SERVICE_URL=http://127.0.0.1:8000
```

Start MongoDB locally before starting the Express API.

> The current transformer is a practical multilingual baseline, not yet the final domain-specific IndicBERT model. The service reports its actual engine mode so the UI never claims transformer inference when it has fallen back.

---

## Project structure

```text
SentinelNet_FullStack_Prototype/
├── package.json
├── README.md
├── .gitignore
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── selftest.js
│       ├── data/store.js
│       ├── middleware/
│       │   ├── errorHandler.js
│       │   ├── requestId.js
│       │   └── validateQuery.js
│       ├── routes/api.js
│       ├── services/intelligenceService.js
│       └── utils/hash.js
└── frontend/
    ├── package.json
    ├── .env.example
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── styles.css
        ├── services/api.js
        └── components/
            ├── Alerts.jsx
            ├── EvidenceLedger.jsx
            ├── Header.jsx
            ├── Metrics.jsx
            ├── Narratives.jsx
            ├── NetworkGraph.jsx
            ├── ProcessingStatus.jsx
            ├── Sidebar.jsx
            └── SocialFeed.jsx
```

## Components you need to install

### Required software

1. **Node.js 20 or newer** — includes npm.
2. A modern browser such as Chrome, Edge or Firefox.
3. Optional: **VS Code** for editing.

You do **not** need Python, MongoDB, Neo4j, Docker or Hyperledger to run this hackathon build.

### npm packages used

**Frontend**
- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`
- `d3`

**Backend**
- `express`
- `cors`
- `helmet`
- `express-rate-limit`
- `morgan`
- `dotenv`

**Root developer helper**
- `concurrently` — runs frontend and backend together.

---

## Installation — easiest method

Open a terminal in the project root:

```bash
npm run install:all
```

That installs the root helper plus all frontend/backend dependencies.

Then start both servers:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:5050/api/health
```

## Installation — manual method

If you prefer separate terminals:

**Terminal 1**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2**
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

---

## Environment variables

The defaults work without creating `.env` files.

For custom configuration:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Windows PowerShell equivalent:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Default backend settings:

```env
PORT=5050
CLIENT_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=240
```

Default frontend setting:

```env
VITE_API_BASE_URL=http://localhost:5050/api
```

---

## Backend API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/posts?q=&risk=` | Filtered intelligence feed |
| GET | `/api/summary` | Dashboard KPIs + narrative velocity |
| GET | `/api/alerts` | Priority threat alerts |
| GET | `/api/network` | Nodes + graph edges |
| POST | `/api/analyze` | Re-run prototype analysis |
| POST | `/api/demo-event` | Inject a 96-risk coordinated event |
| GET | `/api/evidence` | Evidence ledger records |
| POST | `/api/evidence/:id/verify` | Recompute and verify SHA-256 |
| GET | `/api/report` | Complete JSON threat report |

---

## Middleware included

Request path:

```text
Browser
  ↓
CORS
  ↓
Helmet security headers
  ↓
JSON body size limit
  ↓
Request ID middleware
  ↓
Morgan request logger
  ↓
Rate limiter
  ↓
Route-level validation
  ↓
API route / service
  ↓
Centralized error handler
```

This is enough to explain a clean frontend → middleware → backend architecture during judging.

---

## 2-minute demo flow

1. Open **Dashboard** and click **Run Analysis**.
2. Point out high-risk posts, bot count, suspicious clusters and average risk.
3. Search/filter the social feed.
4. Click **Inject Demo Event**. A new high-risk coordinated post appears through the backend API.
5. Open **Network Intelligence**. Drag nodes and click `@citypulse_bot` to show bot probability and centrality.
6. Open **Evidence Ledger**. Select a record and click **Verify Evidence**.
7. Explain that the backend recomputes the SHA-256 hash and checks it against the stored fingerprint.
8. Click **Export Threat Report** to download the current intelligence report as JSON.

---

## How this maps to the intended final architecture

```text
Social APIs / Scrapers / Kafka
            ↓
   NLP + IndicBERT service
            ↓
Narrative / Sentiment / Risk
            ↓
Neo4j + NetworkX + PyG graph layer
            ↓
       SentinelNet API
            ↓
       React Dashboard
            ↓
SHA-256 → Hyperledger Fabric → IPFS
```

The prototype replaces the expensive/external pieces with deterministic synthetic data so it remains demo-safe and reliable.

## Next upgrades after the hackathon MVP

- Move `data/store.js` to MongoDB/PostgreSQL.
- Add Python FastAPI microservice for IndicBERT inference.
- Add Neo4j driver and persist graph relationships.
- Add Kafka/Redpanda ingestion.
- Connect approved platform APIs/data sources.
- Add JWT login + role-based analyst/admin permissions.
- Replace the simulated evidence ledger with a Fabric Gateway client.
- Add Docker Compose for API, web, database and model service.

## Troubleshooting

If the page shows **API OFFLINE**, confirm the backend is running on port `5050`.

If port 5050 is already in use, create `backend/.env` and change `PORT`; then update `frontend/.env` to the same API URL.

If npm install fails, verify:

```bash
node --version
npm --version
```

Use Node 20+ for this project.
