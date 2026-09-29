const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/employer/dashboard - summary stats + job list for the logged-in employer
router.get('/dashboard', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const jobsResult = await db.query(
      `SELECT j.id, j.title, j.status, j.created_at, j.location, j.job_type,
              COUNT(a.id)::int AS application_count
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.id
       WHERE j.employer_id = $1
       GROUP BY j.id
       ORDER BY j.created_at DESC`,
      [req.user.id]
    );

    const statsResult = await db.query(
      `SELECT
        COUNT(DISTINCT j.id)::int AS total_jobs,
        COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'open')::int AS open_jobs,
        COUNT(a.id)::int AS total_applications,
        COUNT(a.id) FILTER (WHERE a.status = 'shortlisted')::int AS shortlisted,
        COUNT(a.id) FILTER (WHERE a.status = 'hired')::int AS hired
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.id
       WHERE j.employer_id = $1`,
      [req.user.id]
    );

    res.json({
      stats: statsResult.rows[0],
      jobs: jobsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load dashboard.' });
  }
});

module.exports = router;
