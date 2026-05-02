import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

const axiosInstance = axios.create({
   baseURL: API_URL,
});

// Setup axios defaults to properly encode URIs
axiosInstance.defaults.paramsSerializer = (params) => {
   return Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&");
};

// Interceptor for setting up Authorization
axiosInstance.interceptors.request.use(
   (async (config: any) => {
      const token = await AsyncStorage.getItem("jwToken");
      const isPublicRoute = config.url?.includes("/api/Account/login") || config.url?.includes("/api/Account/register");
      
      if (token && config.headers && !isPublicRoute) {
         config.headers.Authorization = `Bearer ${token}`;
      }

      console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`, {
         params: config.params,
         data: config.data
      });

      return config;
   }) as any,
   (error) => Promise.reject(error)
);

// Interceptor for refreshing tokens
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
   failedQueue.forEach((prom) => {
      if (error) {
         prom.reject(error);
      } else {
         prom.resolve(token);
      }
   });

   failedQueue = [];
};

axiosInstance.interceptors.response.use(
   (response) => {
      console.log(`✅ [API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
         status: response.status,
         data: response.data
      });
      return response;
   },
   async (error) => {
      console.log(`❌ [API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
         status: error.response?.status,
         data: error.response?.data,
         message: error.message
      });
      const originalRequest = error.config;

      if (
         error.response?.status === 401 &&
         !originalRequest._retry &&
         !originalRequest.url?.includes("/api/Account/refresh-token") &&
         !originalRequest.url?.includes("/api/Account/login") &&
         !originalRequest.url?.includes("/api/Account/register")
      ) {
         if (isRefreshing) {
            return new Promise(function (resolve, reject) {
               failedQueue.push({ resolve, reject });
            })
               .then((token) => {
                  originalRequest.headers["Authorization"] = "Bearer " + token;
                  return axiosInstance(originalRequest);
               })
               .catch((err) => {
                  return Promise.reject(err);
               });
         }

         originalRequest._retry = true;
         isRefreshing = true;

         return new Promise(async (resolve, reject) => {
            try {
               const refreshToken = await AsyncStorage.getItem("refreshToken");

               if (!refreshToken) {
                  throw new Error("No refresh token available");
               }

               // Use a fresh axios call to avoid the interceptor loop
               const response = await axios.post(`${API_URL}/api/Account/refresh-token`, {
                  token: refreshToken,
               });

               const { token: newToken, refreshToken: newRefreshToken, id } = response.data as any;

               const authData: [string, string][] = [
                  ["jwToken", newToken],
                  ["refreshToken", newRefreshToken],
                  ["userId", id],
               ].filter(([_, value]) => value !== undefined && value !== null) as [string, string][];

               await AsyncStorage.multiSet(authData);

               axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + newToken;
               originalRequest.headers["Authorization"] = "Bearer " + newToken;

               processQueue(null, newToken);
               resolve(axiosInstance(originalRequest));
            } catch (err) {
               processQueue(err, null);
               // If refresh fails, clear auth data
               await AsyncStorage.multiRemove(["userId", "jwToken", "refreshToken", "userRoles"]);
               reject(err);
            } finally {
               isRefreshing = false;
            }
         });
      }

      return Promise.reject(error);
   }
);

export default axiosInstance;
