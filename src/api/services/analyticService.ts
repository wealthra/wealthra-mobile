import axiosInstance from "../axiosInstance";
import { getStoredToken, getStoredCurrency } from "./authService";
import { MonthlyCategoryMetricDto, SpendingBreakdownDto, MonthlyTrendsDto } from "../types";

export const getMonthlyMetrics = async (date?: string, currencyOverride?: string): Promise<MonthlyCategoryMetricDto[]> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      const response = await axiosInstance.get<MonthlyCategoryMetricDto[]>(`/api/Analytics/metrics`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { date, currency }
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch monthly metrics:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch monthly metrics");
   }
};
