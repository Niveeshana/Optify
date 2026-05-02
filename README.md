# GlaucomaAI — Clinical Decision Support System

Full-stack web application for glaucoma detection using a pre-trained deep learning model (.h5), with explainability (Grad-CAM), role-based access, RAG chatbot, and dashboards.

---

## Architecture Overview

```
glaucoma-app/
├── frontend/          # React + Vite + TailwindCSS
├── backend/           # FastAPI (Python) — AI inference + RAG + API
└── docs/              # Glaucoma knowledge base (for RAG)
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Recharts |
| Backend | FastAPI (Python 3.10+) |
| AI Model | TensorFlow/Keras (.h5) |
| Explainability | Grad-CAM (tf-keras-vis) |
| Chatbot | LangChain + ChromaDB (RAG) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (fundus images) |

---

## Screens by Role

| Role | Screens |
|---|---|
| **Patient** | Login → Screen 1 (Upload & Diagnose) → Screen 2 (Results + Explanation) |
| **Doctor / Admin** | Login → Screen 3 (Dashboard: all patients, predictions, chatbot) |

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Supabase account (free tier works)
- Your `.h5` model file
- VS Code

---

## Step-by-Step Local Setup

### Step 1 — Clone/open the project

Open VS Code, then open the `glaucoma-app/` folder.

### Step 2 — Supabase Setup

1. Go to https://supabase.com → Create a new project
2. In SQL Editor, run the schema in `docs/supabase_schema.sql`
3. Go to Settings → API → copy:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`
4. Go to Storage → Create a bucket called `fundus-images` (public: false)

### Step 3 — Backend Setup

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Copy your `.h5` model file into `backend/model/glaucoma_model.h5`

Create `backend/.env`:
```
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key   # for chatbot
MODEL_PATH=model/glaucoma_model.h5
IMG_SIZE=224
CHROMA_PERSIST_DIR=./chroma_db
```

Seed the RAG knowledge base (one-time):
```bash
python seed_rag.py
```

Start the backend:
```bash
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Step 4 — Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

Start the frontend:
```bash
npm run dev
```

Open: http://localhost:5173

### Step 5 — Test Credentials (after running schema)

| Role | Email | Password |
|---|---|---|
| Patient | patient@demo.com | demo1234 |
| Doctor | doctor@demo.com | demo1234 |
| Admin | admin@demo.com | demo1234 |

---

## How the AI Pipeline Works

```
Patient uploads fundus image
       ↓
Backend resizes to 224×224
       ↓
Keras model predicts GON+/GON− + confidence
       ↓
Grad-CAM generates heatmap overlay
       ↓
Result stored in Supabase
       ↓
Frontend shows: diagnosis + confidence + heatmap + explanation
```

## How the RAG Chatbot Works

```
User types question
       ↓
LangChain embeds query
       ↓
ChromaDB retrieves top-K relevant chunks from glaucoma knowledge base
       ↓
Claude (via Anthropic API) generates answer grounded in retrieved context
       ↓
Response shown with source citations
```
