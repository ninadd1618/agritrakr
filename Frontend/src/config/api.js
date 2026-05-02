import axios from 'axios';

// Base URL logic
const baseURL = import.meta.env.DEV
  ? '' // use Vite proxy in development
  : import.meta.env.VITE_API_URL || 'https://agrotech-backend-436b.onrender.com'; // fallback

// Warning if missing (but don't crash)
if (!import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  console.warn('⚠️ VITE_API_URL not set, using fallback URL');
}

export const API_BASE_URL = baseURL;

// Axios instance
const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API RESPONSE] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Handle auth errors - only redirect on explicit auth endpoints
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      if (isAuthEndpoint) {
        console.warn("Auth endpoint failed → redirecting to login");
        window.location.href = '/login';
      } else {
        console.warn("401 error on non-auth endpoint - not redirecting");
      }
    }

    // Log useful debugging info
    console.error("API ERROR:", {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

export default apiClient;