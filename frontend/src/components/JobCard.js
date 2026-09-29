import React from 'react';
import { Link } from 'react-router-dom';

const JOB_TYPE_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
};

function formatSalary(min, max) {
  if (!min && !max) return null;
  const fmt = (n) => `$${Number(n).toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max);
}

export default function JobCard({ job }) {
  const salary = formatSalary(job.salary_min, job.salary_max);
  return (
    <Link to={`/jobs/${job.id}`} className="job-card">
      <div className="job-card-header">
        <h3>{job.title}</h3>
        <span className="job-type-badge">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</span>
      </div>
      <p className="job-company">{job.company_name}</p>
      <p className="job-meta">
        {job.location}{job.is_remote ? ' · Remote' : ''} · {job.category}
      </p>
      {salary && <p className="job-salary">{salary}</p>}
      <p className="job-snippet">{job.description.slice(0, 140)}{job.description.length > 140 ? '…' : ''}</p>
      <p className="job-date">Posted {new Date(job.created_at).toLocaleDateString()}</p>
    </Link>
  );
}
