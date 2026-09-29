import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EmployerDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.employerDashboard(token).then(setData).catch((err) => setError(err.message));
  }, [token]);

  if (error) return <div className="container page"><p className="error-text">{error}</p></div>;
  if (!data) return <div className="container page">Loading…</div>;

  const { stats, jobs } = data;

  return (
    <div className="container page">
      <div className="dashboard-header">
        <h1>Employer dashboard</h1>
        <Link to="/employer/post-job" className="btn-primary">+ Post a job</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-number">{stats.total_jobs}</span>Total jobs</div>
        <div className="stat-card"><span className="stat-number">{stats.open_jobs}</span>Open jobs</div>
        <div className="stat-card"><span className="stat-number">{stats.total_applications}</span>Applications</div>
        <div className="stat-card"><span className="stat-number">{stats.shortlisted}</span>Shortlisted</div>
        <div className="stat-card"><span className="stat-number">{stats.hired}</span>Hired</div>
      </div>

      <h2>Your job postings</h2>
      {jobs.length === 0 ? (
        <p>You haven't posted any jobs yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Title</th><th>Status</th><th>Location</th><th>Applicants</th><th></th></tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td><span className={`status-pill status-${job.status}`}>{job.status}</span></td>
                <td>{job.location}</td>
                <td>{job.application_count}</td>
                <td><Link to={`/employer/jobs/${job.id}/applicants`}>View applicants →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
