import React, { useEffect, useState, useCallback } from 'react';
import JobCard from '../components/JobCard';
import Pagination from '../components/Pagination';
import { api } from '../api/client';

const JOB_TYPES = [
  { value: '', label: 'All types' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
];

export default function JobListings() {
  const [filters, setFilters] = useState({
    q: '', location: '', category: '', jobType: '', remote: '', sort: 'newest',
  });
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getJobs({ ...filters, page, limit: 9 });
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleFilterChange = (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  return (
    <div className="container page">
      <h1>Find your next job</h1>

      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          name="q"
          placeholder="Job title, skill, or keyword"
          value={filters.q}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={filters.location}
          onChange={handleFilterChange}
        />
        <button type="submit">Search</button>
      </form>

      <div className="filter-row">
        <select name="jobType" value={filters.jobType} onChange={handleFilterChange}>
          {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input
          type="text"
          name="category"
          placeholder="Category (e.g. Engineering)"
          value={filters.category}
          onChange={handleFilterChange}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.remote === 'true'}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, remote: e.target.checked ? 'true' : '' })); }}
          />
          Remote only
        </label>
        <select name="sort" value={filters.sort} onChange={handleFilterChange}>
          <option value="newest">Newest</option>
          <option value="relevance">Most relevant</option>
          <option value="salary_high">Salary: high to low</option>
          <option value="salary_low">Salary: low to high</option>
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <p>No jobs match your search yet. Try broadening your filters.</p>
      ) : (
        <>
          <div className="job-grid">
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
