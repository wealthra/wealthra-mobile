import axiosInstance from "../axiosInstance";
import { getStoredToken } from "./authService";

export const getFinancialRecommendations = async (): Promise<string[]> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const response = await axiosInstance.get<string[]>(`/api/Recommendation`, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch recommendations:", error);
      // Return empty array on failure as fallback
      return [];
   }
};
