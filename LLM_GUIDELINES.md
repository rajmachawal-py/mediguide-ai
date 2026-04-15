# 🤖 MediGuide AI — LLM Guidelines

> **⚠️ READ THIS BEFORE MODIFYING ANY AI/LLM CODE IN THIS PROJECT.**
>
> This document exists because a teammate's AI assistant (Antigravity) once rewrote `gemini_service.py` to use the `google.generativeai` SDK with an API key, which broke the entire backend. Follow these rules to prevent that from happening again.

---

## ✅ What We Use

| Component | Technology | SDK | Auth Method |
|-----------|-----------|-----|-------------|
| **LLM (Triage, Summary, Schemes)** | Google Gemini 2.5 Flash | `vertexai` (Vertex AI SDK) | Service Account JSON |
| **Speech-to-Text (STT)** | Sarvam AI (`saaras:v3`) | REST API | `SARVAM_API_KEY` |
| **Text-to-Speech (TTS)** | Sarvam AI (`bulbul:v3`) | REST API | `SARVAM_API_KEY` |

---

## 🚫 What We Do NOT Use

| ❌ DO NOT USE | Why |
|--------------|-----|
| `google.generativeai` SDK | **DEPRECATED** (June 2025). Uses API keys. We use Vertex AI instead. |
| `GEMINI_API_KEY` / AI Studio keys | We authenticate via **service account JSON**, not API keys. |
| `genai.configure(api_key=...)` | This is the old SDK pattern. Never use this. |
| `genai.GenerativeModel(...)` | Use `vertexai.generative_models.GenerativeModel(...)` instead. |

---

## 🔑 Authentication Setup

### Service Account JSON
- **File:** `mediguide-ai-493217-a93b02a2293b.json` (in project root, gitignored)
- **Env var:** `GOOGLE_APPLICATION_CREDENTIALS` in `backend/.env`
- **How it works:** The Vertex AI SDK reads this path from the environment and authenticates automatically.

### Required `.env` Variables for LLM
```env
GEMINI_API_KEY=""                    # LEAVE EMPTY — not used
GCP_PROJECT_ID="mediguide-ai-493217"
GCP_LOCATION="us-central1"
GOOGLE_APPLICATION_CREDENTIALS="<absolute-path-to-service-account-json>"
```

> **Note:** Each team member must set their own absolute path for `GOOGLE_APPLICATION_CREDENTIALS`.

---

## 📁 Key LLM File: `backend/app/services/gemini_service.py`

### Correct Import Pattern
```python
# ✅ CORRECT — Vertex AI SDK
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig, Content, Part

vertexai.init(project="mediguide-ai-493217", location="us-central1")
model = GenerativeModel(model_name="gemini-2.5-flash")
```

```python
# ❌ WRONG — Deprecated google.generativeai SDK
import google.generativeai as genai
genai.configure(api_key="AIza...")       # DO NOT DO THIS
model = genai.GenerativeModel("gemini-2.5-flash")
```

### Chat History Format
```python
# ✅ CORRECT — Vertex AI uses Content objects
from vertexai.generative_models import Content, Part

history = [
    Content(role="user", parts=[Part.from_text("I have a headache")]),
    Content(role="model", parts=[Part.from_text("How long have you had it?")]),
]
chat = model.start_chat(history=history)
```

```python
# ❌ WRONG — Plain dicts (works with google.generativeai, NOT with Vertex AI)
history = [
    {"role": "user", "parts": ["I have a headache"]},
    {"role": "model", "parts": ["How long have you had it?"]},
]
```

### Image/Multimodal Parts
```python
# ✅ CORRECT — Vertex AI Part.from_data
from vertexai.generative_models import Part

image_part = Part.from_data(data=image_bytes, mime_type="image/jpeg")
response = model.generate_content([text_prompt, image_part])
```

```python
# ❌ WRONG — Dict-based inline data (google.generativeai style)
image_part = {"mime_type": "image/jpeg", "data": image_bytes}
```

---

## 🛡️ Rules for AI Assistants (Antigravity / Copilot / Cursor)

1. **NEVER replace `vertexai` imports with `google.generativeai`.**
2. **NEVER add `genai.configure(api_key=...)` anywhere in the codebase.**
3. **NEVER change the auth method** from service account JSON to API key.
4. **ALWAYS use `Content` and `Part` objects** for chat history and multimodal input.
5. **If you see a deprecation warning** about `google.generativeai`, that's expected — we already migrated away from it.
6. **Model name is `gemini-2.5-flash`** — do not downgrade to `gemini-1.5-flash` or other variants.
7. **The service account JSON file is gitignored** — never commit it. Each dev sets up their own.

---

## 🔧 Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `GEMINI_API_KEY is not set` | Someone switched to `google.generativeai` SDK | Revert to Vertex AI SDK (see above) |
| `history must be a list of Content objects` | Using plain dicts instead of `Content()` | Use `Content(role=..., parts=[Part.from_text(...)])` |
| `Could not automatically determine credentials` | Missing/wrong JSON path | Check `GOOGLE_APPLICATION_CREDENTIALS` path in `.env` |
| `403 Permission Denied` | Service account lacks Vertex AI permissions | Enable Vertex AI API in GCP Console + add `Vertex AI User` role |
| `google.generativeai FutureWarning` | Old SDK still imported somewhere | Find and replace with `vertexai` imports |

---

*Last updated: April 15, 2026 — by Aziz + Antigravity*
