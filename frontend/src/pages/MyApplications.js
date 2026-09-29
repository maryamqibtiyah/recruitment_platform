import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired',
};

export default function MyApplications() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myApplications(token)
      .then((data) => setApplications(data.applications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="container page">Loading…</div>;

  return (
    <div className="container page">
      <h1>My applications</h1>
      {error && <p className="error-text">{error}</p>}
      {applications.length === 0 ? (
        <p>You haven't applied to any jobs yet. <Link to="/">Browse jobs</Link></p>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Job</th><th>Company</th><th>Applied</th><th>Status</th></tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id}>
                <td><Link to={`/jobs/${a.job_id}`}>{a.title}</Link></td>
                <td>{a.company_name}</td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
                <td><span className={`status-pill status-${a.status}`}>{STATUS_LABELS[a.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
