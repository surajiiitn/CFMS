# CFMS Frontend

React + Vite client for the Campus Freelance Management System.

## Environment

Create `frontend/.env` from `frontend/.env.example`:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

If you open the app from a phone using your laptop LAN IP, loopback URLs in these vars are auto-rewritten to your current host at runtime.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- Authentication token is stored in `localStorage`.
- Private pages are protected and redirect to `/login` on `401`.
- Workspace chat uses Socket.IO rooms per workspace ID.
