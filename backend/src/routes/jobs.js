const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary'];

// GET /api/jobs
// Public search & browse endpoint.
// Query params: q, location, category, jobType, remote, minSalary, page, limit, sort
router.get('/', async (req, res) => {
  try {
    const {
      q,
      location,
      category,
      jobType,
      remote,
      minSalary,
      page = 1,
      limit = 10,
      sort = 'newest',
    } = req.query;

    const where = [`status = 'open'`];
    const params = [];

    if (q) {
      params.push(q);
      where.push(`search_vector @@ plainto_tsquery('english', $${params.length})`);
    }
    if (location) {
      params.push(`%${location}%`);
      where.push(`location ILIKE $${params.length}`);
    }
    if (category) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    if (jobType && JOB_TYPES.includes(jobType)) {
      params.push(jobType);
      where.push(`job_type = $${params.length}`);
    }
    if (remote === 'true') {
      where.push(`is_remote = true`);
    }
    if (minSalary) {
      params.push(Number(minSalary));
      where.push(`(salary_max IS NULL OR salary_max >= $${params.length})`);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let orderBy = 'created_at DESC';
    if (sort === 'salary_high') orderBy = 'salary_max DESC NULLS LAST';
    if (sort === 'salary_low') orderBy = 'salary_min ASC NULLS LAST';
    if (sort === 'relevance' && q) {
      params.push(q);
      orderBy = `ts_rank(search_vector, plainto_tsquery('english', $${params.length})) DESC`;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM jobs ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    params.push(limitNum, offset);
    const { rows } = await db.query(
      `SELECT j.id, j.title, j.description, j.location, j.is_remote, j.job_type,
              j.category, j.salary_min, j.salary_max, j.created_at,
              u.company_name, u.id AS employer_id
       FROM jobs j
       JOIN users u ON u.id = j.employer_id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      jobs: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch jobs.' });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT j.*, u.company_name, u.company_website, u.full_name AS posted_by
       FROM jobs j JOIN users u ON u.id = j.employer_id
       WHERE j.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Job not found.' });
    res.json({ job: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch job.' });
  }
});

// POST /api/jobs (employer only)
router.post('/', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const {
      title, description, requirements, location, isRemote,
      jobType, category, salaryMin, salaryMax, status,
    } = req.body;

    if (!title || !description || !location || !jobType || !category) {
      return res.status(400).json({ error: 'title, description, location, jobType, and category are required.' });
    }
    if (!JOB_TYPES.includes(jobType)) {
      return res.status(400).json({ error: `jobType must be one of: ${JOB_TYPES.join(', ')}` });
    }

    const { rows } = await db.query(
      `INSERT INTO jobs (employer_id, title, description, requirements, location, is_remote,
                          job_type, category, salary_min, salary_max, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        req.user.id, title, description, requirements || null, location, !!isRemote,
        jobType, category, salaryMin || null, salaryMax || null, status === 'draft' ? 'draft' : 'open',
      ]
    );
    res.status(201).json({ job: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create job.' });
  }
});

// PUT /api/jobs/:id (employer, own job only)
router.put('/:id', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const existing = await db.query('SELECT employer_id FROM jobs WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Job not found.' });
    if (existing.rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own job postings.' });
    }

    const {
      title, description, requirements, location, isRemote,
      jobType, category, salaryMin, salaryMax, status,
    } = req.body;

    const { rows } = await db.query(
      `UPDATE jobs SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        requirements = COALESCE($3, requirements),
        location = COALESCE($4, location),
        is_remote = COALESCE($5, is_remote),
        job_type = COALESCE($6, job_type),
        category = COALESCE($7, category),
        salary_min = $8,
        salary_max = $9,
        status = COALESCE($10, status)
       WHERE id = $11
       RETURNING *`,
      [title, description, requirements, location, isRemote, jobType, category,
       salaryMin ?? null, salaryMax ?? null, status, req.params.id]
    );
    res.json({ job: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update job.' });
  }
});

// DELETE /api/jobs/:id (employer, own job only)
router.delete('/:id', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const existing = await db.query('SELECT employer_id FROM jobs WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Job not found.' });
    if (existing.rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own job postings.' });
    }
    await db.query('DELETE FROM jobs WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete job.' });
  }
});

module.exports = router;
