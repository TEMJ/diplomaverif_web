import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// For debugging - remove in production
console.log('API URL:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout if needed
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If data is FormData, remove Content-Type so browser sets it correctly with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      console.log(`FormData Request: ${config.method?.toUpperCase()} ${config.url}`);
    } else {
      // Log for debugging
      console.log(`${config.method?.toUpperCase()} ${config.url}`, config.params || {});
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Log for debugging
    if (!response.data) {
      console.warn('Empty response data:', response.config.url);
    }
    return response;
  },
  (error) => {
    if (!error.response) {
      // Network error (no response from server)
      console.error('Network Error:', error.message);
      toast.error('Server connection error. Please check your connection.');
      return Promise.reject(error);
    }

    console.error('Response Error:', {
      status: error.response.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });

    switch (error.response.status) {
      case 401:
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
      case 403:
        toast.error('You do not have the necessary permissions');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        const message = error.response?.data?.message 
          || error.response?.data?.error 
          || 'An error occurred';
        toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
