import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('netra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('netra_token');
      localStorage.removeItem('netra_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
