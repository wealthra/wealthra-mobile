import axiosInstance from "../axiosInstance";
import { getStoredToken, getStoredCurrency } from "./authService";
import { FinancialDashboardDto, SpendingBreakdownDto, MonthlyTrendsDto } from "../types";

export const getFinancialSummary = async (): Promise<FinancialDashboardDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = await getStoredCurrency();
      console.log(`🚀 [DEBUG] Fetching financial summary for currency: ${currency}`);

      const response = await axiosInstance.get<FinancialDashboardDto>('/api/Summary/dashboard', {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      console.log("✅ [DEBUG] Financial Summary API Response:", JSON.stringify(response.data, null, 2));
      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch dashboard summary:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch dashboard summary");
   }
};

export const getSpendingBreakdown = async (startDate?: string, endDate?: string): Promise<SpendingBreakdownDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = await getStoredCurrency();
      const response = await axiosInstance.get<SpendingBreakdownDto>(`/api/Statistics/breakdown`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { startDate, endDate, currency }
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch spending breakdown:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch spending breakdown");
   }
};

export const getMonthlyTrends = async (year?: number): Promise<MonthlyTrendsDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = await getStoredCurrency();
      const response = await axiosInstance.get<MonthlyTrendsDto>(`/api/Statistics/trends`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { year, currency }
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch monthly trends:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch monthly trends");
   }
};
