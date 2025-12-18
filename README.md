# SocialCrew AI — Backend

A Python backend powered by CrewAI that generates short-form social content and an analytics summary for a given topic. It produces two primary outputs in this folder:

- `social_posts.json`: structured social posts (X and LinkedIn) with hooks, body, CTA, and hashtags.
- `analytics_summary.md`: a markdown summary with top-performing ideas and recommendations.

The backend reads agent and task definitions from YAML config and supports multiple LLM providers via environment variables.

## Tech Stack

- Python 3.10–3.13
- [CrewAI](https://docs.crewai.com/) (`crewai[tools]`)
- Project packaging via `pyproject.toml` (hatchling build backend)

## Project Structure

```
backend/
  src/socialcrew_ai/
    crew.py           # Crew setup: agents, tasks, process
    main.py           # Entry points: run/train/replay/test
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
```

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

```bash
# 1) Create venv and install
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .

# 2) Add provider keys to backend/.env (do NOT commit)
# GROQ_API_KEY=...  GROQ_MODEL=groq/llama-3.1-8b-instant

# 3) Run with a topic
TOPIC="tennis" PYTHONPATH=src python -m socialcrew_ai.main

# Alternative explicit run
TOPIC="tennis" PYTHONPATH=src python - <<'PY'
from socialcrew_ai.main import run
run()
PY

# 4) Check outputs
ls -l social_posts.json analytics_summary.md
tail -n 10 run.log
```
