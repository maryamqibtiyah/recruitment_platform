import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import JobListings from './pages/JobListings';
import JobDetail from './pages/JobDetail';
import ApplyToJob from './pages/ApplyToJob';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployerDashboard from './pages/EmployerDashboard';
import PostJob from './pages/PostJob';
import JobApplicants from './pages/JobApplicants';
import MyApplications from './pages/MyApplications';

import './styles/index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<JobListings />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/jobs/:id/apply"
              element={<ProtectedRoute role="jobseeker"><ApplyToJob /></ProtectedRoute>}
            />
            <Route
              path="/my-applications"
              element={<ProtectedRoute role="jobseeker"><MyApplications /></ProtectedRoute>}
            />

            <Route
              path="/employer/dashboard"
              element={<ProtectedRoute role="employer"><EmployerDashboard /></ProtectedRoute>}
            />
            <Route
              path="/employer/post-job"
              element={<ProtectedRoute role="employer"><PostJob /></ProtectedRoute>}
            />
            <Route
              path="/employer/jobs/:jobId/applicants"
              element={<ProtectedRoute role="employer"><JobApplicants /></ProtectedRoute>}
            />

            <Route path="*" element={<div className="container page"><h1>Page not found</h1></div>} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
