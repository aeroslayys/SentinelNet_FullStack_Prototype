const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json();
}

export const api = {
  health: () => request('/health'),
  posts: (q = '', risk = 'all') => request(`/posts?q=${encodeURIComponent(q)}&risk=${encodeURIComponent(risk)}`),
  createPost: (post) => request('/posts', { method: 'POST', body: JSON.stringify(post) }),
  summary: () => request('/summary'),
  alerts: () => request('/alerts'),
  network: () => request('/network'),
  evidence: () => request('/evidence'),
  analyze: () => request('/analyze', { method: 'POST' }),
  injectDemoEvent: () => request('/demo-event', { method: 'POST' }),
  verifyEvidence: (id) => request(`/evidence/${encodeURIComponent(id)}/verify`, { method: 'POST' }),
  report: () => request('/report')
};
