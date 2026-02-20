# CFMS (Campus Freelance Management System)

Full-stack platform for campus micro-jobs where students can post tasks, submit proposals, collaborate in real-time workspaces, and complete deliveries with review flow.

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind, React Query, Socket.IO client
- Backend: Node.js, Express, MongoDB (Mongoose), Redis, Socket.IO
- Auth: JWT + OTP email verification (Resend)

## Repository Structure

```text
CFMS/
├── backend/   # Express API + Socket server
├── frontend/  # React web app
└── README.md  # Main project guide
```

## Core Features

- OTP-based registration with college email validation
- JWT authentication and role switching (`poster` / `freelancer`)
- Jobs, proposals, acceptance/rejection workflow
- Real-time workspace chat and status events via Socket.IO
- Submission + approval lifecycle and ratings
- Notifications and dashboard analytics
- Frontend backend-health monitoring with reconnect-aware UI status

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB running locally or remotely
- Redis (recommended; app falls back to in-memory OTP store if Redis is unavailable)

## Quick Start

1. Clone and open the repository

```bash
git clone <your-repo-url>
cd CFMS
```

2. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Update `backend/.env` at minimum:

- `MONGODB_URI`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`

3. Configure frontend environment

```bash
cp frontend/.env.example frontend/.env
```

Default values usually work locally:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

4. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

5. Run both services (two terminals)

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

6. Open app

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:5000/api/health`

## Scripts

### Backend (`backend/package.json`)

- `npm run dev` - start with nodemon
- `npm start` - start production server

### Frontend (`frontend/package.json`)

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run Vitest

## Environment Notes

- Backend API base path: `/api`
- Socket server runs on backend host/port
- `ALLOWED_ORIGIN` supports comma-separated origins
- In development, private-network origins are accepted automatically for LAN testing
- If backend is unreachable, frontend shows connection status and retries GET requests for transient failures

## Additional Docs

- Backend details: `backend/README.md`
- Frontend details: `frontend/README.md`

## Troubleshooting

- `Unable to reach backend`: verify backend is running and `VITE_API_URL` is correct.
- OTP email not sending: ensure `RESEND_API_KEY` and `EMAIL_FROM` are valid in `backend/.env`.
- CORS errors: update `ALLOWED_ORIGIN` in backend `.env` to include your frontend origin.
- Mongo/Redis connection issues: confirm services are running and URLs in `.env` are reachable.
