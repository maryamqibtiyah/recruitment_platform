-- =========================================================
-- Recruitment Platform - PostgreSQL Schema
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- USERS ----------
-- Single table for both roles keeps auth simple; role decides
-- which fields/endpoints apply.
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('jobseeker', 'employer')),
    full_name       VARCHAR(255) NOT NULL,
    company_name    VARCHAR(255),           -- employers only
    company_website VARCHAR(255),           -- employers only
    headline        VARCHAR(255),           -- jobseekers only (e.g. "Frontend Engineer")
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- JOBS ----------
CREATE TABLE IF NOT EXISTS jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    requirements    TEXT,
    location        VARCHAR(255) NOT NULL,
    is_remote       BOOLEAN NOT NULL DEFAULT false,
    job_type        VARCHAR(30) NOT NULL CHECK (job_type IN
                        ('full_time', 'part_time', 'contract', 'internship', 'temporary')),
    category        VARCHAR(100) NOT NULL,
    salary_min      INTEGER,
    salary_max      INTEGER,
    status          VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full-text search across title/description/requirements
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(requirements, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_jobs_search_vector ON jobs USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs (employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs (category);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs (location);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);

-- ---------- APPLICATIONS ----------
CREATE TABLE IF NOT EXISTS applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_filename VARCHAR(255) NOT NULL,   -- stored filename on disk/object storage
    resume_original_name VARCHAR(255) NOT NULL,
    cover_letter    TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN
                        ('submitted', 'reviewed', 'shortlisted', 'rejected', 'hired')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, applicant_id)            -- one application per job per user
);

CREATE INDEX IF NOT EXISTS idx_applications_job ON applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications (applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);

-- ---------- keep updated_at fresh ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
