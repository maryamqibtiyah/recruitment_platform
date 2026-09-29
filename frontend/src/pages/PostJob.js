import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const initialState = {
  title: '', description: '', requirements: '', location: '',
  isRemote: false, jobType: 'full_time', category: '',
  salaryMin: '', salaryMax: '', status: 'open',
};

export default function PostJob() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      };
      const { job } = await api.createJob(payload, token);
      navigate(`/jobs/${job.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page narrow">
      <h1>Post a new job</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Job title
          <input name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Description
          <textarea name="description" rows={6} value={form.description} onChange={handleChange} required />
        </label>

        <label>
          Requirements (optional)
          <textarea name="requirements" rows={4} value={form.requirements} onChange={handleChange} />
        </label>

        <label>
          Location
          <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Lagos, Nigeria" required />
        </label>

        <label className="checkbox-label">
          <input type="checkbox" name="isRemote" checked={form.isRemote} onChange={handleChange} />
          This role is remote
        </label>

        <label>
          Job type
          <select name="jobType" value={form.jobType} onChange={handleChange}>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="temporary">Temporary</option>
          </select>
        </label>

        <label>
          Category
          <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Engineering" required />
        </label>

        <div className="two-col">
          <label>
            Salary min (optional)
            <input type="number" name="salaryMin" value={form.salaryMin} onChange={handleChange} />
          </label>
          <label>
            Salary max (optional)
            <input type="number" name="salaryMax" value={form.salaryMax} onChange={handleChange} />
          </label>
        </div>

        <label>
          Publish as
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="open">Open (visible immediately)</option>
            <option value="draft">Draft (save for later)</option>
          </select>
        </label>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post job'}
        </button>
      </form>
    </div>
  );
}
