# SocialCrew AI — Backend

## Overview

SocialCrew AI is a modular, agent-based backend system for generating and analyzing social media content using LLMs. It is built with modern Python, leverages the CrewAI framework for agent orchestration, and exposes a robust HTTP API using FastAPI for seamless integration with web frontends or other services.

### Key Features

- **Agentic Content Generation:** Uses CrewAI to coordinate multiple agents (content creator, analyst, etc.) for producing high-quality, structured social posts and analytics.
- **Configurable via YAML:** Agent roles, goals, and tasks are defined in YAML for easy customization.
- **Multi-provider LLM Support:** Works with OpenAI, Groq, and other OpenAI-compatible APIs via environment variables.
- **Modern Python Packaging:** Uses `pyproject.toml` and hatchling for reproducible builds and dependency management.
- **HTTP API:** Exposes a FastAPI app for running the workflow as a web service (suitable for Render, etc.).
- **CLI Entrypoints:** Also supports running, training, replaying, and testing via CLI or Python module.

---

## Architecture

```
┌────────────┐      HTTP POST /run      ┌──────────────┐
│  Frontend  │ ───────────────────────▶ │   FastAPI    │
│ (Next.js)  │                         │  (main.py)   │
└────────────┘   ◀───── JSON resp ─────┘      │
        │                                    │
        ▼                                    ▼
  Reads/Streams                      CrewAI Orchestration
   social_posts.json,                ┌─────────────────────┐
   analytics_summary.md   ─────────▶ │  SocialcrewAi Crew  │
   run.log (outputs)                 └─────────────────────┘
```

### Main Components

- **FastAPI App:** Exposes `/run` endpoint for triggering the workflow. Accepts a topic, returns status and output info.
- **CrewAI Orchestration:** `crew.py` defines the agents, tasks, and process. `main.py` runs the workflow and logs results.
- **Config:** YAML files in `config/` define agent personalities and task flows.
- **Outputs:**
  - `social_posts.json`: Posts for X and LinkedIn (hook, body, CTA, hashtags)
  - `analytics_summary.md`: Markdown summary of top ideas and recommendations
  - `run.log`: Status log for each run

---

## Tools, Libraries, and Frameworks

- **Python 3.10–3.13**: Modern language features and type hints
- **[CrewAI](https://docs.crewai.com/)**: Agent orchestration, LLM integration, YAML config
- **[FastAPI](https://fastapi.tiangolo.com/)**: High-performance async HTTP API
- **[Uvicorn](https://www.uvicorn.org/)**: ASGI server for FastAPI (production-ready)
- **[Pydantic](https://docs.pydantic.dev/)**: Data validation and settings management
- **Hatchling**: Build backend for Python packaging
- **YAML**: Agent/task config
- **Render**: (Recommended) for cloud deployment as a web service

---

## Project Structure

```
backend/
  src/socialcrew_ai/
    crew.py           # Crew setup: agents, tasks, process
    main.py           # FastAPI app, CLI entrypoints
    config/
      agents.yaml     # Agent roles, goals, backstory
      tasks.yaml      # Task descriptions and expected outputs
  knowledge/
    user_preference.txt
  social_posts.json   # Generated JSON (output)
  analytics_summary.md# Generated Markdown (output)
  run.log             # Run status log (appended)
  .env                # Optional environment variables for local runs
  pyproject.toml      # Dependencies and console scripts
  Procfile            # For Render/Heroku: web process definition
```

---

## How It Works

1. **Configuration:**
   - Define agents and tasks in YAML (`config/agents.yaml`, `config/tasks.yaml`).
   - Set LLM provider keys in `.env` or environment variables.
2. **Run Workflow:**
   - Via HTTP: POST to `/run` with `{ "topic": "Your Topic" }` (FastAPI)
   - Via CLI: `run_crew` or `python -m socialcrew_ai.main`
3. **CrewAI Orchestration:**
   - Loads config, instantiates agents, runs tasks, coordinates outputs.
4. **Outputs:**
   - Writes `social_posts.json`, `analytics_summary.md`, and logs status to `run.log`.
5. **Frontend Integration:**
   - Next.js frontend triggers backend, streams logs, and displays outputs.

---

## HTTP API (FastAPI)

The backend exposes a FastAPI app (see `main.py`).

- **POST /run**
  - Request: `{ "topic": "AI LLMs" }`
  - Response: `{ "status": "completed", "topic": "AI LLMs", "year": "2025", "message": "Crew run completed successfully." }`
  - On error: HTTP 500 with error message

The app is started via Uvicorn (see `Procfile`):

```
web: uvicorn socialcrew_ai.main:app --host 0.0.0.0 --port $PORT
```

---

## Setup & Usage

### 1. Install dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
# or use 'uv' for fast installs on macOS arm64
```

### 2. Configure environment

Create a `.env` file with your LLM provider keys (never commit secrets):

```dotenv
GROQ_API_KEY=...
GROQ_MODEL=groq/llama-3.1-8b-instant
# or
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

### 3. Run as a web service (for Render, etc.)

Deploy to Render as a Web Service. Render will use the `Procfile` to start the FastAPI app. The service will be available at `/run`.

### 4. Run locally (CLI or module)

```bash
# CLI (after install)
run_crew
# or
python -m socialcrew_ai.main
```

---

## Extending & Customizing

- **Add new agents/tasks:** Edit YAML in `config/` and update `crew.py` as needed.
- **Change LLM provider:** Set different API keys/models in `.env`.
- **Integrate with other frontends:** Use the HTTP API for easy integration.

---

## License & Credits

- Built with [CrewAI](https://docs.crewai.com/), [FastAPI](https://fastapi.tiangolo.com/), and open-source tools.
- See `pyproject.toml` for full dependency list.

---

## See Also

- [Frontend README](../frontend/README.md) — Next.js app for UI and API proxying
- [CrewAI Documentation](https://docs.crewai.com/)

## Setup

1. Create a virtual environment and install dependencies.

Using `uv` (recommended on macOS arm64):

```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -e .
```

Using `pip`:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

2. Configure environment variables.

You can set provider keys and options in `backend/.env` (the frontend streaming route will merge this into the process environment for local dev):

```dotenv
# Choose one provider (examples):
GROQ_API_KEY=...          # for Groq OpenAI-compatible API
GROQ_MODEL=groq/llama-3.1-8b-instant

# or OpenAI
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini

# Optional: override topic used by runs (default: "AI LLMs")
TOPIC=Generative AI

# Optional: explicitly point to your python interpreter
PYTHON_BIN=/absolute/path/to/.venv/bin/python
```

Never commit secret keys. Prefer `.env` locally and environment configuration in production. The backend repo includes `.gitignore` entries to ignore `.env` and `.venv/`.

## Running

There are two common ways to run the backend.

### A) Run as a Python module (no install scripts needed)

This is how the frontend triggers the backend in local development:

```bash
cd backend
PYTHONPATH=src python -m socialcrew_ai.main
```

You can optionally set `TOPIC` in the environment for the run:

```bash
TOPIC="AI Agents" PYTHONPATH=src python -m socialcrew_ai.main
```

Note: The module has a `__main__` guard, so `python -m socialcrew_ai.main` invokes `run()` by default.

If your shell is zsh and sourcing `.env` is unreliable, either activate the venv or use the venv interpreter directly:

```bash
# Activate venv then run
cd backend
source .venv/bin/activate
PYTHONPATH=src python -m socialcrew_ai.main

# Or use the venv python directly without activation
cd backend
PYTHONPATH=src .venv/bin/python -m socialcrew_ai.main
```

To be explicit about invoking the run entrypoint, you can call `run()` directly:

```bash
cd backend
source .venv/bin/activate
TOPIC="AI Agents" PYTHONPATH=src python - <<'PY'
from socialcrew_ai.main import run
run()
PY
```

### B) Use console scripts (after `pip install -e .`)

The `pyproject.toml` defines console scripts:

- `run_crew` or `socialcrew_ai` → runs the crew (`socialcrew_ai.main:run`)
- `train` → trains the crew (`socialcrew_ai.main:train`)
- `replay` → replays from a task id (`socialcrew_ai.main:replay`)
- `test` → tests the crew (`socialcrew_ai.main:test`)

Examples:

```bash
# Run once
run_crew            # or: socialcrew_ai

# Train for N iterations and write to a file
train 3 outputs.json

# Replay starting at a specific task id
replay generate_content_task

# Test for N iterations using a specific evaluator/model
test 2 gpt-4o-mini
```

## Configuration

- Agents: `src/socialcrew_ai/config/agents.yaml`
- Tasks: `src/socialcrew_ai/config/tasks.yaml`

Customize roles, goals, task descriptions, and expected outputs in YAML. The crew in `crew.py` wires these together and sets `output_file` for each task (`social_posts.json` and `analytics_summary.md`).

## Outputs & Logs

- `social_posts.json`: two platforms (`x`, `linkedin`), each with 3 post variants.
- `analytics_summary.md`: top posts and 3 tactical recommendations.
- `run.log`: appends a line per run with status (`completed` or `failed`), topic, and timestamp.

## Frontend Integration

The Next.js frontend includes API routes that spawn the backend process locally (or proxy to a remote backend if `BACKEND_URL` is set). For local dev, the streaming route reads `backend/.env` and merges those variables before spawning the backend process.

If you provide a hosted backend, expose (example API surface):

- `GET /run` → Server-Sent Events (SSE) stream of logs (accepts `?topic=...`).
- `GET /file/:name` → Returns files like `social_posts.json` or `analytics_summary.md`.

In this repository, the backend is CLI-focused; the frontend provides the HTTP layer. For production hosting, either:

- Run the CLI on a server and mount endpoints that execute the run and serve files, or
- Use the frontend with `BACKEND_URL` pointing to that hosted service.

## Troubleshooting

- Ensure your provider API key is set (`GROQ_API_KEY` or `OPENAI_API_KEY`). Rotate keys if they were ever committed.
- Verify your virtual environment is active and `crewai` is installed (`pip show crewai`).
- If `python -m socialcrew_ai.main` appears to do nothing, call `run()` explicitly (see above) or use `run_crew`.
- For local runs initiated by the frontend, check the SSE logs in the UI and the `run.log` file here.
- If zsh errors when sourcing `.env`, remove stray text and ensure lines are `KEY=VALUE` without spaces around `=`.

## Quick Start

This project supports multiple ways to run the backend. Use this decision guide:

- Use `run_crew` when you’ve installed the package (`pip install -e .`) and want the simplest, reliable command line.
- Use `python -m socialcrew_ai.main` when you prefer not to install and are okay setting `PYTHONPATH=src` (this mirrors how the frontend spawns locally). This now calls `run()` by default.
- Use the explicit `run()` invocation when you want a bulletproof path that avoids shell/module quirks.

### 0) Prereqs

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
# Optional but recommended for console scripts:
pip install -e .

# Add provider keys to backend/.env (do NOT commit):
# GROQ_API_KEY=...  GROQ_MODEL=groq/llama-3.1-8b-instant
# or OPENAI_API_KEY=... OPENAI_MODEL=gpt-4o-mini
```

### Option A — Console script (recommended after install)

```bash
cd backend
source .venv/bin/activate

# Run once (uses TOPIC from environment or defaults to "AI LLMs")
run_crew

# Run with an explicit topic
TOPIC="tennis" run_crew

# Training example
train 3 outputs.json

# Replay from a task id
replay generate_content_task

# Test for N iterations using a specific evaluator/model
test 2 gpt-4o-mini
```

### Option B — Python module (no install; mirrors frontend spawn)

```bash
cd backend
# venv activated or use system Python with crewai available
source .venv/bin/activate

# Run with PYTHONPATH=src (module has a __main__ guard that calls run())
PYTHONPATH=src python -m socialcrew_ai.main

# With a topic
TOPIC="tennis" PYTHONPATH=src python -m socialcrew_ai.main

# If you prefer not to activate venv, use its interpreter directly
PYTHONPATH=src .venv/bin/python -m socialcrew_ai.main
```

### Option C — Explicit entry: call `run()` directly

```bash
cd backend
source .venv/bin/activate
TOPIC="tennis" PYTHONPATH=src python - <<'PY'
from socialcrew_ai.main import run
run()
PY
```

### Verify outputs

```bash
cd backend
ls -l social_posts.json analytics_summary.md
tail -n 10 run.log
```

### When to use which

- `run_crew`: Best for everyday usage after `pip install -e .`. Gives you `train`, `replay`, `test` commands too.
- `python -m`: Best when you want zero install and to emulate the frontend’s local spawn behavior. Requires `PYTHONPATH=src`.
- Explicit `run()` heredoc: Most deterministic; use if your shell has sourcing issues or you want to be certain `run()` is invoked.

### Frontend tie-in (for local dev)

- The frontend streaming route reads `backend/.env` and spawns `python -m socialcrew_ai.main` with `PYTHONPATH=src`.
- Set `TOPIC` in the UI or in env; outputs land in this backend folder for the frontend to read.
