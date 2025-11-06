import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Pour le débogage - à enlever en production
console.log('API URL:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Augmenter le timeout si nécessaire
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log pour déboguer
    console.log(`${config.method?.toUpperCase()} ${config.url}`, config.params || {});
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Log pour déboguer
    if (!response.data) {
      console.warn('Empty response data:', response.config.url);
    }
    return response;
  },
  (error) => {
    if (!error.response) {
      // Erreur réseau (pas de réponse du serveur)
      console.error('Network Error:', error.message);
      toast.error('Erreur de connexion au serveur. Vérifiez votre connexion.');
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
        toast.error("Vous n'avez pas les permissions nécessaires");
        break;
      case 404:
        toast.error('Ressource non trouvée');
        break;
      case 500:
        toast.error('Erreur serveur. Veuillez réessayer plus tard.');
        break;
      default:
        const message = error.response?.data?.message 
          || error.response?.data?.error 
          || 'Une erreur est survenue';
        toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Test de connexion à l'API au démarrage
axiosInstance.get('/health-check').catch(error => {
  console.warn('API health check failed:', error.message);
});

export default axiosInstance;
