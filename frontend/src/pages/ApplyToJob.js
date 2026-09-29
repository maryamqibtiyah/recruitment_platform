import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ApplyToJob() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.getJob(id).then((data) => setJob(data.job)).catch((err) => setError(err.message));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!resumeFile) {
      setError('Please attach your resume (PDF, DOC, or DOCX).');
      return;
    }

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('coverLetter', coverLetter);

    setSubmitting(true);
    try {
      await api.apply(id, formData, token);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container page">
        <h1>Application submitted 🎉</h1>
        <p>Your application for <strong>{job?.title}</strong> has been sent.</p>
        <Link to="/my-applications" className="btn-primary">View my applications</Link>
      </div>
    );
  }

  return (
    <div className="container page narrow">
      <h1>Apply {job ? `to ${job.title}` : ''}</h1>
      {job && <p className="job-company">{job.company_name}</p>}

      <form onSubmit={handleSubmit} className="form">
        <label>
          Resume (PDF, DOC, or DOCX — max 5MB)
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files[0])}
            required
          />
        </label>

        <label>
          Cover letter (optional)
          <textarea
            rows={8}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell the employer why you're a great fit…"
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </form>
    </div>
  );
}
