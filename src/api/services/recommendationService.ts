import axiosInstance from "../axiosInstance";
import { getStoredToken, getStoredCurrency } from "./authService";

export const getFinancialRecommendations = async (): Promise<string[]> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = await getStoredCurrency();
      const response = await axiosInstance.get<string[]>(`/api/Recommendations/personalized`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch recommendations:", error);
      // Return empty array on failure as fallback
      return [];
   }
};
