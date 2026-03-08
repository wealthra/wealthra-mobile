import axiosInstance from "../axiosInstance";
import { getStoredToken, getStoredUserId } from "./authService";
import { FinancialSummary } from "../types";

export const getFinancialSummary = async (): Promise<FinancialSummary> => {
   try {
      const token = await getStoredToken();
      const userId = await getStoredUserId();

      if (!token || !userId) {
         throw new Error("No authentication token or user ID found");
      }

      const response = await axiosInstance.get<FinancialSummary>(`/api/Summary/dashboard`);

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch financial summary:", {
         error: error.message,
         response: error.response?.data,
      });
      throw new Error(error.response?.data?.message || "Failed to fetch financial summary");
   }
};
