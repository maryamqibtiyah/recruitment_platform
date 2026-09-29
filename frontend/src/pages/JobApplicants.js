import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['submitted', 'reviewed', 'shortlisted', 'rejected', 'hired'];

export default function JobApplicants() {
  const { jobId } = useParams();
  const { token } = useAuth();
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.jobApplicants(jobId, token)
      .then((data) => setApplicants(data.applications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [jobId, token]);

  const handleStatusChange = async (applicationId, status) => {
    try {
      await api.updateApplicationStatus(applicationId, status, token);
      setApplicants((list) => list.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="container page">Loading…</div>;

  return (
    <div className="container page">
      <Link to="/employer/dashboard" className="back-link">← Back to dashboard</Link>
      <h1>Applicants</h1>
      {error && <p className="error-text">{error}</p>}
      {applicants.length === 0 ? (
        <p>No applications yet for this job.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Headline</th><th>Applied</th><th>Resume</th><th>Cover letter</th><th>Status</th></tr>
          </thead>
          <tbody>
            {applicants.map((a) => (
              <tr key={a.id}>
                <td>{a.full_name}<br /><span className="muted">{a.email}</span></td>
                <td>{a.headline || '—'}</td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
                <td>
                  <a href={api.resumeDownloadUrl(a.id) + `?token=${token}`}
                     onClick={(e) => {
                       // resume route requires the Authorization header, not a query param;
                       // fetch as a blob then trigger download.
                       e.preventDefault();
                       fetch(api.resumeDownloadUrl(a.id), { headers: { Authorization: `Bearer ${token}` } })
                         .then((res) => res.blob())
                         .then((blob) => {
                           const url = URL.createObjectURL(blob);
                           const link = document.createElement('a');
                           link.href = url;
                           link.download = a.resume_original_name;
                           link.click();
                           URL.revokeObjectURL(url);
                         });
                     }}
                  >
                    {a.resume_original_name}
                  </a>
                </td>
                <td className="cover-letter-cell">{a.cover_letter || '—'}</td>
                <td>
                  <select value={a.status} onChange={(e) => handleStatusChange(a.id, e.target.value)}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
