# CFMS Backend

Express + MongoDB + Redis + Socket.IO backend for CFMS.

## Environment

Create `backend/.env` from `backend/.env.example`.

Required OTP email vars:

- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY=...`
- `EMAIL_FROM=CFMS <noreply@your-domain.com>`
- `HOST` can be set to `0.0.0.0` to expose backend on your LAN.
- `ALLOWED_ORIGIN` can be a comma-separated list (example: `http://localhost:8080,http://127.0.0.1:8080`)
- In `development`, loopback and private-network origins are allowed automatically for local phone/LAN testing.

## Run

```bash
npm install
npm run dev
```

## API Base

`/api`

## Health Check

`GET /api/health`

## Features

- OTP registration via real email delivery (Resend API, Redis-backed with memory fallback)
- JWT auth + role switching (`poster` / `freelancer`)
- Jobs + proposals + workspace lifecycle
- Real-time workspace chat via Socket.IO
- Submission approval and ratings
- Notification feed
