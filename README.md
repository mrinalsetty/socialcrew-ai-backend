# SocialCrew AI Backend

NestJS + Fastify backend for **SocialCrew AI**, a human-first AI content studio that turns one user idea into a full team-style conversation between three AI teammates:

- a strategist
- a creator
- an analyst

The backend powers both:

- the main generation workflow
- follow-up team conversation
- backend status and metadata endpoints
- the backend dashboard UI served from the backend root

---

## What the backend does

The backend is responsible for:

- receiving a user topic and target platform
- generating a human-style strategy explanation
- generating 5 platform-specific post suggestions
- generating shared hashtags
- analysing all generated options
- choosing the strongest option
- creating team-style conversation messages
- handling follow-up user questions for one or more agents
- exposing health and system metadata for the frontend dashboard
- serving a backend dashboard UI at the root route

---

## Core Product Logic

The backend simulates a small human-style content team.

### Agent roles

#### Strategy agent

Explains:

- overall strategy
- strongest angles
- audience fit
- platform-specific reasoning
- why the selected direction should work

#### Creator agent

Explains:

- what was created
- why 5 different suggestions were chosen
- how each suggestion differs
- the creative reasoning behind the set

Then generates:

- 5 suggestions
- title + description for each
- 5 shared hashtags

#### Analyst agent

Explains:

- how the options compare
- who each one is best for
- which is strongest
- demographic / audience-fit reasoning
- why one option stands out most

---

## Main Features

- **NestJS backend**
- **Fastify runtime**
- **TypeScript**
- **Groq-powered generation**
- **Human-style multi-agent orchestration**
- **Follow-up chat support**
- **Health endpoint**
- **System metadata endpoint**
- **Backend dashboard UI**
- **CORS support for local + deployed frontend**

---

## Tech Stack

- **NestJS**
- **Fastify**
- **TypeScript**
- **Groq SDK**

---

## Supported Platforms

The backend currently supports:

- `LINKEDIN`
- `YOUTUBE`
- `FACEBOOK`
- `X`
- `INSTAGRAM`
- `THREADS`

---

## API Endpoints

### `GET /`

Backend dashboard UI

This is not just a plain API root. It serves a visual dashboard showing:

- service name
- status
- version
- stack
- architecture
- model info
- health JSON
- frontend app link

---

### `GET /health`

Health endpoint

#### Example response

```json
{
  "status": "ok",
  "service": "socialcrew-ai-backend",
  "version": "3.0.0",
  "uptimeSeconds": 42,
  "timestamp": "2026-03-03T12:00:00.000Z",
  "llmProvider": "groq",
  "graphRuntime": "custom-service-orchestration",
  "creatorModel": "llama-3.1-8b-instant",
  "analystModel": "llama-3.3-70b-versatile"
}
```
