const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadResume, UPLOAD_DIR } = require('../middleware/upload');

const router = express.Router();

// POST /api/applications/:jobId  (jobseeker only) - apply with resume upload
router.post(
  '/:jobId',
  requireAuth,
  requireRole('jobseeker'),
  (req, res, next) => {
    uploadResume.single('resume')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { coverLetter } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'A resume file (PDF/DOC/DOCX) is required.' });
      }

      const job = await db.query(`SELECT id, status FROM jobs WHERE id = $1`, [jobId]);
      if (!job.rows[0]) return res.status(404).json({ error: 'Job not found.' });
      if (job.rows[0].status !== 'open') {
        return res.status(400).json({ error: 'This job is no longer accepting applications.' });
      }

      const { rows } = await db.query(
        `INSERT INTO applications (job_id, applicant_id, resume_filename, resume_original_name, cover_letter)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [jobId, req.user.id, req.file.filename, req.file.originalname, coverLetter || null]
      );

      res.status(201).json({ application: rows[0] });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'You have already applied to this job.' });
      }
      console.error(err);
      res.status(500).json({ error: 'Could not submit application.' });
    }
  }
);

// GET /api/applications/mine (jobseeker) - track my applications
router.get('/mine', requireAuth, requireRole('jobseeker'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT a.id, a.status, a.cover_letter, a.resume_original_name, a.created_at,
              j.id AS job_id, j.title, j.location, j.job_type, u.company_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = j.employer_id
       WHERE a.applicant_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json({ applications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch your applications.' });
  }
});

// GET /api/applications/job/:jobId (employer, own job only) - review applicants
router.get('/job/:jobId', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const jobCheck = await db.query('SELECT employer_id FROM jobs WHERE id = $1', [req.params.jobId]);
    if (!jobCheck.rows[0]) return res.status(404).json({ error: 'Job not found.' });
    if (jobCheck.rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view applicants for your own jobs.' });
    }

    const { rows } = await db.query(
      `SELECT a.id, a.status, a.cover_letter, a.resume_original_name, a.resume_filename, a.created_at,
              u.id AS applicant_id, u.full_name, u.email, u.headline
       FROM applications a
       JOIN users u ON u.id = a.applicant_id
       WHERE a.job_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.jobId]
    );
    res.json({ applications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch applicants.' });
  }
});

// PATCH /api/applications/:id/status (employer, own job only)
router.patch('/:id/status', requireAuth, requireRole('employer'), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['submitted', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
    }

    const check = await db.query(
      `SELECT j.employer_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = $1`,
      [req.params.id]
    );
    if (!check.rows[0]) return res.status(404).json({ error: 'Application not found.' });
    if (check.rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only manage applicants for your own jobs.' });
    }

    const { rows } = await db.query(
      `UPDATE applications SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    res.json({ application: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update application status.' });
  }
});

// GET /api/applications/:id/resume (employer who owns the job, or the applicant) - download resume
router.get('/:id/resume', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT a.*, j.employer_id
       FROM applications a JOIN jobs j ON j.id = a.job_id
       WHERE a.id = $1`,
      [req.params.id]
    );
    const application = rows[0];
    if (!application) return res.status(404).json({ error: 'Application not found.' });

    const isOwnerEmployer = req.user.role === 'employer' && req.user.id === application.employer_id;
    const isApplicant = req.user.role === 'jobseeker' && req.user.id === application.applicant_id;
    if (!isOwnerEmployer && !isApplicant) {
      return res.status(403).json({ error: 'You do not have access to this resume.' });
    }

    const filePath = path.join(UPLOAD_DIR, application.resume_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Resume file not found on server.' });
    }
    res.download(filePath, application.resume_original_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch resume.' });
  }
});

module.exports = router;
