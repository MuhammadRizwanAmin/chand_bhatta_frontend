import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://darkslategrey-curlew-103305.hostingersite.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});



// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const locationId = localStorage.getItem('locationId');
    if (locationId) {
      config.headers['x-location-id'] = locationId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      // Only redirect if explicitly not using the offline/local bhatta session
      if (token && token !== 'chand-bricks-auth-token') {
        console.warn('Unauthorized request - session maintained for local operations');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
