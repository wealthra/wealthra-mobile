import axiosInstance from "../axiosInstance";
import { getStoredToken } from "./authService";
import { MonthlyCategoryMetricDto, SpendingBreakdownDto, MonthlyTrendsDto } from "../types";

export const getMonthlyMetrics = async (date?: string): Promise<MonthlyCategoryMetricDto[]> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const response = await axiosInstance.get<MonthlyCategoryMetricDto[]>(`/api/Analytics/metrics`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { date }
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch monthly metrics:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch monthly metrics");
   }
};
