import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getJob(id)
      .then((data) => setJob(data.job))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container page">Loading…</div>;
  if (error) return <div className="container page"><p className="error-text">{error}</p></div>;
  if (!job) return null;

  return (
    <div className="container page job-detail">
      <Link to="/" className="back-link">← Back to jobs</Link>
      <h1>{job.title}</h1>
      <p className="job-company">{job.company_name}</p>
      <p className="job-meta">
        {job.location}{job.is_remote ? ' · Remote' : ''} · {job.category}
      </p>
      {(job.salary_min || job.salary_max) && (
        <p className="job-salary">
          {job.salary_min && `$${Number(job.salary_min).toLocaleString()}`}
          {job.salary_min && job.salary_max && ' – '}
          {job.salary_max && `$${Number(job.salary_max).toLocaleString()}`}
        </p>
      )}

      <section>
        <h2>Job description</h2>
        <p className="preserve-lines">{job.description}</p>
      </section>

      {job.requirements && (
        <section>
          <h2>Requirements</h2>
          <p className="preserve-lines">{job.requirements}</p>
        </section>
      )}

      {job.status !== 'open' ? (
        <p className="notice">This job is no longer accepting applications.</p>
      ) : !user ? (
        <Link to="/login" className="btn-primary">Log in to apply</Link>
      ) : user.role === 'jobseeker' ? (
        <Link to={`/jobs/${job.id}/apply`} className="btn-primary">Apply now</Link>
      ) : (
        <p className="notice">Employer accounts can't apply to jobs.</p>
      )}
    </div>
  );
}
