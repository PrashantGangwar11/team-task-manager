# Team Task Manager (Full-Stack)

Full-stack task manager where users can create projects, assign tasks, and track status with role-based access (`ADMIN` / `MEMBER`).

## Tech Stack

- Frontend: Vite + TypeScript (vanilla TS UI)
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma ORM
- Auth: JWT + bcrypt

## Features Implemented

- Signup and login
- Project creation
- Team role management (invite by email with role)
- Task creation and assignment checks
- Task status tracking (`TODO`, `IN_PROGRESS`, `DONE`)
- Dashboard summary (`total`, status breakdown, overdue)
- Role-based access at project membership level

## Local Setup

### 1) Backend

```bash
cd server
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

### 2) Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## REST API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/:projectId/invite` (ADMIN only)
- `GET /api/tasks/project/:projectId`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId/status`
- `GET /api/dashboard`

## Railway Deployment (Mandatory)

Deploy as **two Railway services** using the same repo.

### Backend service

- Root Directory: `server`
- Start command: `npm start`
- Build command: `npm install && npm run prisma:generate`
- Add variables:
  - `DATABASE_URL` (Railway PostgreSQL URL)
  - `JWT_SECRET`
  - `CLIENT_URL` (frontend Railway URL)

After first deploy, run `npm run prisma:push` once in Railway shell.

### Frontend service

- Root Directory: `client`
- Build command: `npm install && npm run build`
- Start command: `npm run preview -- --host 0.0.0.0 --port $PORT`
- Variable:
  - `VITE_API_URL` = backend URL + `/api`

## Notes

- Project-level RBAC is enforced for task/project APIs.
- A task assignee must be a member of the same project.
