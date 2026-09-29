import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: 'jobseeker', fullName: '', email: '', password: '',
    companyName: '', companyWebsite: '', headline: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === 'employer' ? '/employer/dashboard' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page narrow">
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="role-toggle">
          <button
            type="button"
            className={form.role === 'jobseeker' ? 'active' : ''}
            onClick={() => setForm((f) => ({ ...f, role: 'jobseeker' }))}
          >
            I'm looking for a job
          </button>
          <button
            type="button"
            className={form.role === 'employer' ? 'active' : ''}
            onClick={() => setForm((f) => ({ ...f, role: 'employer' }))}
          >
            I'm hiring
          </button>
        </div>

        <label>
          Full name
          <input name="fullName" value={form.fullName} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Password (min 8 characters)
          <input type="password" name="password" minLength={8} value={form.password} onChange={handleChange} required />
        </label>

        {form.role === 'jobseeker' && (
          <label>
            Headline (optional)
            <input name="headline" placeholder="e.g. Frontend Engineer" value={form.headline} onChange={handleChange} />
          </label>
        )}

        {form.role === 'employer' && (
          <>
            <label>
              Company name
              <input name="companyName" value={form.companyName} onChange={handleChange} required />
            </label>
            <label>
              Company website (optional)
              <input name="companyWebsite" value={form.companyWebsite} onChange={handleChange} />
            </label>
          </>
        )}

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
