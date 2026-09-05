
Load older messages




























Review
6. Click **"Generate Message"** → a personalised message (or deterministic template) is shown.
7. Press **"Recover Now"** → the UI simulates sending the message, retrying the payment, and finally marks the payment as *SUCCESS*.
8. Return to the Dashboard – the **Recovered Revenue** and **Recovery Rate** have increased.
---
## 🛡️ Safety & Guardrails
- Message generation forbids requesting OTP, CVV, UPI PIN, passwords or any sensitive credential.
- Only the provided secure retry link is ever inserted.
- LLM responses are stripped of markdown and checked for prohibited keywords before being sent to the customer.
- When the LLM is unavailable, deterministic templates guarantee safe output.
---
## 💻 Local Development
```bash
# install all dependencies
npm run install:all
# start backend (listens on PORT env, default 5000)
npm run dev:backend
# start frontend (Vite dev server proxies /api to backend)
npm run dev:frontend
# build for production
npm run build   # runs both backend and frontend builds
```
### Environment variables
- **Backend (`backend/.env.example`)**
  ```env
  PORT=5000
  DATABASE_URL="file:./dev.db"
  # OpenAI (optional) – leave blank to use deterministic fallback
  OPENAI_API_KEY=""
  OPENAI_BASE_URL="https://api.openai.com/v1"
  OPENAI_MODEL="gpt-4o-mini"
  ```
- **Frontend (`frontend/.env.example`)**
  ```env
  VITE_API_URL="/api"   # Vite proxies to backend in dev
  ```
---
## ☁️ Render Deployment Architecture
- **Frontend** – Render *Static Site* service, built with `npm run build:frontend` and served from `frontend/dist`.
- **Backend** – Render *Web Service* (`node dist/index.js`), exposing `/api/*` endpoints.
- **Database** – SQLite file bundled with the backend container (persistent volume on Render).
---
## ⚠️ Limitations / Demo Notes
- All recovery actions are **simulated** – no real payment gateway or WhatsApp/SMS integration.
- AI calls are optional; without an API key the system uses the deterministic fallback engine.
- Metrics are derived from the seeded SQLite dataset; they reset on fresh deployments.
---
## 🚀 Future Improvements
- Integrate a real payment provider (Razorpay) for live retries.
- Hook up a messaging provider (Twilio, WhatsApp Business) for actual customer outreach.
- Add background workers / queue for bulk recovery campaigns.
- Expand AI guardrails with a configurable policy engine.
- Persist activity logs and expose an audit trail UI.
---
## 🙏 Credits
**Vanshita‑27** – creator & maintainer
---
