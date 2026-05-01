import axios from 'axios';

// Base URL logic
const baseURL = import.meta.env.DEV
  ? '' // use Vite proxy in development
  : import.meta.env.VITE_API_URL; // MUST be set in Netlify

// Fail fast if missing in production
if (!import.meta.env.DEV && !baseURL) {
  throw new Error("VITE_API_URL is not defined. Fix your Netlify environment variables.");
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
    // Handle auth errors
    if (error.response?.status === 401) {
      console.warn("Unauthorized → redirecting to login");
      window.location.href = '/login';
    }

    // Log useful debugging info
    console.error("API ERROR:", {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

export default apiClient;