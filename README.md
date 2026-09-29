# HireHub — Recruitment Platform

A full-stack job board: employers post jobs and review applicants, jobseekers
search jobs and apply with a resume upload.

## Tech stack

**Frontend:** React 18 (CRA), React Router v6, Context API (auth), plain
mobile-first CSS, Fetch API.

**Backend:** Node.js, Express, JWT auth (jsonwebtoken), bcryptjs, `pg`
(node-postgres), multer (file uploads), cors/morgan/dotenv.

**Database:** PostgreSQL (built for Supabase, accessed directly via a
connection string — no Supabase client SDK / RLS; all authorization is
enforced in the Express layer).

**Architecture:** Traditional 3-tier — React SPA → Express REST API →
PostgreSQL. Stateless JWT auth, role-based access control (`jobseeker` /
`employer`) enforced server-side via middleware.

## Features

- Job postings — employers create/edit/close listings
- Full-text search + filters (keyword, location, category, job type, remote,
  salary) with pagination and sorting, backed by a Postgres `tsvector` index
- Resume upload — jobseekers attach a PDF/DOC/DOCX when applying (multer,
  5MB limit, validated MIME type)
- Job applications — one application per job per user, tracked through a
  status pipeline (submitted → reviewed → shortlisted → rejected/hired)
- Employer dashboard — stats + per-job applicant lists, resume download,
  status updates
- Jobseeker "My Applications" — track status of every application

## Project structure

```
recruitment-platform/
├── backend/
│   ├── schema.sql            # run once against your Postgres database
│   ├── src/
│   │   ├── index.js          # Express app entrypoint
│   │   ├── db.js             # pg Pool
│   │   ├── migrate.js        # applies schema.sql (npm run migrate)
│   │   ├── middleware/       # auth (JWT) + upload (multer)
│   │   ├── routes/           # auth, jobs, applications, employer
│   │   └── uploads/          # resume files land here (see note below)
│   └── .env.example
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/client.js     # fetch wrapper
    │   ├── context/AuthContext.js
    │   ├── components/       # Navbar, JobCard, Pagination, ProtectedRoute
    │   ├── pages/             # all routed pages
    │   └── styles/index.css  # mobile-first design system
    └── .env.example
```

## Local setup

### 1. Database
Create a Postgres database (Supabase works well), then:
```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET
npm install
npm run migrate             # applies schema.sql
npm run dev                 # starts API on :5000
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env        # REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start                   # starts React on :3000
```

## Deploying to Railway

1. Push this repo to GitHub.
2. Create two Railway services from the same repo:
   - **Backend**: root `backend/`, start command `npm start`, set
     `DATABASE_URL` (Supabase connection string), `JWT_SECRET`,
     `CLIENT_URL` (your frontend's Railway URL), `NODE_ENV=production`.
   - **Frontend**: root `frontend/`, build command `npm run build`, start
     command `npx serve -s build`, set `REACT_APP_API_URL` to your backend's
     Railway URL + `/api`.
3. Run `npm run migrate` once against production `DATABASE_URL` (locally,
   pointed at prod, or via a Railway one-off command) to create the schema.

**Note on file storage:** resumes are saved to local disk
(`backend/src/uploads/`). Railway's filesystem is ephemeral on redeploy, so
for production durability swap the `multer` disk storage in
`middleware/upload.js` for an object store (e.g. Supabase Storage or S3) —
the rest of the app (routes, DB schema, download endpoint) doesn't need to
change, only where the file bytes are written and read from.

## Database design notes

- `users` holds both roles; `role` gates which fields/endpoints apply.
- `jobs.search_vector` is a generated, indexed `tsvector` (title weighted
  highest, then category, description, requirements) powering the keyword
  search via `plainto_tsquery`.
- `applications` has a `UNIQUE (job_id, applicant_id)` constraint — the DB
  itself prevents duplicate applications.
- Indexes on `employer_id`, `status`, `category`, `location`, `created_at`
  keep browse/filter/dashboard queries fast as data grows.
