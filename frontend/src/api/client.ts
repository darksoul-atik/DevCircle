import axios from 'axios';

// Get token from memory/state (will be managed by a context or store later)
export let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // For httpOnly cookies (refresh token)
});

client.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh token
        const res = await axios.post(
          `${client.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const newAccessToken = res.data.data.accessToken;
        setAccessToken(newAccessToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user must log in again
        setAccessToken(null);
        // Optionally trigger a custom event or redirect here
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
