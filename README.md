# carelo

AI documentation assistant for social workers in German youth welfare. Voice notes in, structured case reports out.

## Context

Social workers in youth welfare (Kinder- und Jugendhilfe) spend a large part of their week writing case documentation instead of being with the young people they support. I know that system from the inside: I went into a children's home at 15.

carelo was built in two weeks during the **START Munich Sprint** in winter semester 2025/26, where it won. During the sprint we talked to social workers about how they document today and built the prototype around that.

The project is **paused**. The problem is real, but youth welfare has almost no budget for software, so there is no business behind it yet. The code stays here as a working prototype.

## What it does

- **Voice notes** recorded in the browser are transcribed and assigned to the right case
- **AI insights** flag risks and patterns across a case
- **Help plans and reports** (Hilfeplan and 5 other SGB VIII formats) are drafted from the notes, with PDF/DOCX export
- **Documents** (PDF, images) are read via OCR and added to the case timeline
- **Tasks** per case with priorities and due dates

To try it, run it locally (see below). Without a backend the dashboard runs on demo data and the AI features are off.

## Quick Start

### Option A: Frontend Only (No API key needed)

The dashboard works without a backend for UI exploration:

```bash
git clone https://github.com/jennifoofoo/carelo.git
cd carelo
npm install
npm run dev
```

Then open [localhost:8080/dashboard](http://localhost:8080/dashboard). Demo mode, no login needed.

### Option B: Full Stack (AI features enabled)

```bash
# 1. Clone
git clone https://github.com/jennifoofoo/carelo.git
cd carelo

# 2. Setup environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY from aistudio.google.com (free tier)

# 3. Start Backend
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 -m uvicorn src.main:app --reload --port 8000

# 4. Start Frontend (new terminal)
cd ..
npm install
npm run dev
```

Open [http://localhost:8080/dashboard](http://localhost:8080/dashboard).

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Required for AI features
GEMINI_API_KEY=...               # aistudio.google.com

# Required for auth
JWT_SECRET_KEY=...                # openssl rand -hex 32

# Frontend (auto-detected in dev)
VITE_API_BASE_URL=http://localhost:8000
```

See `.env.example` for the full list.

## Architecture

```
carelo/
├── src/                  # React frontend (TypeScript)
│   ├── pages/            # Routes: Dashboard, PitchDeck, Landing
│   ├── components/       # UI components (dashboard, pitch, ui)
│   └── hooks/            # Custom React hooks
├── backend/              # FastAPI backend (Python)
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── ai/           # AI pipeline (insights, reports, agents)
│   │   └── ingest/       # Voice, PDF, OCR processing
│   └── tests/            # pytest test suite
├── docker-compose.*.yml  # Docker deployment configs
└── .github/workflows/    # CI/CD pipelines
```

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Framer Motion
**Backend:** FastAPI · PostgreSQL · SQLModel · Redis · Celery · Gemini Flash (originally GPT-4o-mini)
**Infrastructure:** Docker · Railway · Nginx

## Deployment

### Railway

```bash
npm install -g @railway/cli
railway login
railway init

railway add --database postgres
railway add --database redis

railway variables set GEMINI_API_KEY=...
railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)
railway variables set ALLOWED_ORIGINS=https://your-app.railway.app

git push origin main
railway domain
```

### Docker Compose

```bash
cp env.production.example .env.production
# Edit .env.production

docker-compose -f docker-compose.prod.yml up -d
curl http://localhost/health
```

## Testing

```bash
# Frontend
npm run lint
npm run build

# Backend
cd backend
pytest
```


## License

All rights reserved. Feel free to read the code, but please ask before reusing it.
