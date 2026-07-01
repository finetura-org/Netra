import axios from 'axios';

export const getBackendBaseUrl = () => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || 
                  host === '127.0.0.1' || 
                  host.startsWith('192.168.') || 
                  host.startsWith('10.') || 
                  host.startsWith('172.') || 
                  host.endsWith('.local');
  if (isLocal) {
    return 'http://localhost:8000';
  }
  return 'https://netra-backend-d92d.onrender.com';
};

const API_BASE = `${getBackendBaseUrl()}/api`;
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
