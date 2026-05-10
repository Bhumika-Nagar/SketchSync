import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const BASE_URL = "http://localhost:5000";


const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});


const getToken = () => localStorage.getItem("token");


const setToken = (token: string) => {
  localStorage.setItem("token", token);
};


api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

  
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.token;

        
        setToken(newAccessToken);

        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token expired. Please login again.");

        
        localStorage.removeItem("token");
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const apiRequest = async <T = unknown>(
  method: AxiosRequestConfig["method"],
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response: AxiosResponse<T> = await api({
    method,
    url,
    data,
    ...config,
  });

  return response.data;
};

export default api;
