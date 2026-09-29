const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Thin fetch wrapper: attaches JWT, parses JSON, throws readable errors.
async function request(path, { method = 'GET', body, isFormData = false, token } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),

  // Jobs
  getJobs: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return request(`/jobs${qs ? `?${qs}` : ''}`);
  },
  getJob: (id) => request(`/jobs/${id}`),
  createJob: (payload, token) => request('/jobs', { method: 'POST', body: payload, token }),
  updateJob: (id, payload, token) => request(`/jobs/${id}`, { method: 'PUT', body: payload, token }),
  deleteJob: (id, token) => request(`/jobs/${id}`, { method: 'DELETE', token }),

  // Applications
  apply: (jobId, formData, token) =>
    request(`/applications/${jobId}`, { method: 'POST', body: formData, isFormData: true, token }),
  myApplications: (token) => request('/applications/mine', { token }),
  jobApplicants: (jobId, token) => request(`/applications/job/${jobId}`, { token }),
  updateApplicationStatus: (id, status, token) =>
    request(`/applications/${id}/status`, { method: 'PATCH', body: { status }, token }),
  resumeDownloadUrl: (id) => `${API_URL}/applications/${id}/resume`,

  // Employer
  employerDashboard: (token) => request('/employer/dashboard', { token }),
};

export { API_URL };
