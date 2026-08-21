# Personal AI Assistant (NVIDIA Nemotron 3 Ultra)

A production-grade, modular, and extensible Personal AI Assistant platform built with **Next.js (App Router)**, **Tailwind CSS**, **FastAPI**, **PostgreSQL / SQLAlchemy 2.x**, and the **NVIDIA Nemotron 3 Ultra** API (`nvidia/nemotron-3-ultra-550b-a55b`).

---

## 🚀 Features

- **Real-Time Streaming**: Low-latency Server-Sent Events (SSE) token streaming with live thinking/reasoning view and stop generation controls.
- **Provider-Agnostic AI Architecture**: Abstract `AIProvider` base interface with dedicated `NVIDIAProvider` communicating server-side with `https://integrate.api.nvidia.com/v1`.
- **Context Builder & Long-Term Memory**: Automatic user preference extraction and injection alongside a sliding window conversation history.
- **File Ingestion & Document QA**: Support for uploading and querying `PDF`, `DOCX`, and `TXT` files.
- **Full Conversation Management**: Search conversations across titles & message history, auto-generated short titles, pin, rename, and delete.
- **Rich Dark-Themed UI**: Built with Tailwind CSS, Framer Motion, syntax highlighted code blocks with language pills & copy feedback, and Markdown rendering.
- **Global Keyboard Shortcuts**:
  - `Ctrl / Cmd + K`: Search conversations
  - `Ctrl / Cmd + Shift + O`: New conversation
  - `Escape`: Stop AI generation
  - `Enter`: Send message / `Shift + Enter`: New line
- **Enterprise Security**: JWT access & refresh tokens, password hashing (Argon2 / bcrypt), CORS protection, rate limiting, and backend-only secret isolation.

---

## 📁 Directory Structure

```text
├── docker-compose.yml              # PostgreSQL (+ pgvector) & Redis
├── README.md
├── backend/
│   ├── app/
│   │   ├── api/v1/                 # Endpoints (auth, users, conversations, chat, memory, files, settings, health)
│   │   ├── core/                   # Security, exceptions, rate-limiting, logging, pydantic settings
│   │   ├── db/                     # Async session & declarative base
│   │   ├── models/                 # SQLAlchemy 2.0 async models
│   │   ├── schemas/                # Pydantic v2 schemas
│   │   ├── services/               # AIService, ContextBuilder, ConversationService, MemoryService, FileService
│   │   ├── providers/              # AIProvider base & NVIDIAProvider
│   │   ├── prompts/                # System persona & title generator prompts
│   │   └── tools/                  # Extensible tool registry (Calculator, Datetime, WebSearch)
│   ├── alembic/                    # Database migrations
│   └── requirements.txt
└── frontend/
    ├── app/                        # Next.js App Router (chat, login, register, settings)
    ├── components/                 # Reusable chat and layout components
    ├── hooks/                      # useChat, useConversations, useAuth, useKeyboardShortcuts
    ├── lib/                        # API client with automatic token refreshing
    ├── services/                   # Frontend API wrappers
    └── types/                      # TypeScript contracts
```

---

## 🛠️ Quickstart & Local Development

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` (or copy from `backend/.env.example`):

```env
PROJECT_NAME="Personal AI Assistant"
ENVIRONMENT="development"
DEBUG=True

# Database (Default uses local SQLite; PostgreSQL with pgvector is also supported)
DATABASE_URL="sqlite+aiosqlite:///./nemotron.db"

# Security & JWT
JWT_SECRET="your-32-character-secret-key-goes-here-12345"
JWT_REFRESH_SECRET="your-32-character-refresh-secret-key-67890"

# NVIDIA AI Configuration
NVIDIA_API_KEY="your-nvidia-api-key-here"
NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL="nvidia/nemotron-3-ultra-550b-a55b"
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The web application will be available at: `http://localhost:3000`.

---

## 🐳 Running with Docker (PostgreSQL & Redis)

To run PostgreSQL with `pgvector` and Redis locally:

```bash
docker-compose up -d
```

Update `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/nemotron_db"
```

---

## 🧪 Running Automated Tests

```bash
cd backend
pytest -v
```
