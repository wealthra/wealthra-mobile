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
      if (token && config.headers) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
   }) as any,
   (error) => Promise.reject(error)
);

export default axiosInstance;
