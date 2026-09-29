import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="brand">HireHub</Link>
        <nav className="nav-links">
          <Link to="/">Find Jobs</Link>
          {user?.role === 'employer' && <Link to="/employer/dashboard">Dashboard</Link>}
          {user?.role === 'employer' && <Link to="/employer/post-job">Post a Job</Link>}
          {user?.role === 'jobseeker' && <Link to="/my-applications">My Applications</Link>}
          {!user && <Link to="/login">Log In</Link>}
          {!user && <Link to="/register" className="btn-inline">Sign Up</Link>}
          {user && (
            <button className="link-button" onClick={handleLogout}>
              Log Out ({user.full_name.split(' ')[0]})
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
