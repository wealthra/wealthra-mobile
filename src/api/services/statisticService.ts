import axiosInstance from "../axiosInstance";
import { getStoredToken, getStoredCurrency } from "./authService";
import { FinancialDashboardDto, SpendingBreakdownDto, MonthlyTrendsDto } from "../types";
import { roundFinancialData } from "../../utils/roundingUtils";

export const getFinancialSummary = async (currencyOverride?: string): Promise<FinancialDashboardDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      console.log(`🚀 [DEBUG] Fetching financial summary for currency: ${currency}`);

      const response = await axiosInstance.get<FinancialDashboardDto>('/api/Summary/dashboard', {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error("Failed to fetch dashboard summary:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch dashboard summary");
   }
};

export const getFinancialSummaryWeb = async (currencyOverride?: string): Promise<FinancialDashboardDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      console.log(`🚀 [DEBUG] Fetching financial summary web for currency: ${currency}`);

      const response = await axiosInstance.get<FinancialDashboardDto>('/api/Summary/dashboard-web', {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error("Failed to fetch dashboard web summary:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch dashboard web summary");
   }
};

export const getSpendingBreakdown = async (startDate?: string, endDate?: string, currencyOverride?: string): Promise<SpendingBreakdownDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      const response = await axiosInstance.get<SpendingBreakdownDto>(`/api/Statistics/breakdown`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { startDate, endDate, currency }
      });

      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error("Failed to fetch spending breakdown:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch spending breakdown");
   }
};

export const getMonthlyTrends = async (year?: number, currencyOverride?: string): Promise<MonthlyTrendsDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      const response = await axiosInstance.get<MonthlyTrendsDto>(`/api/Statistics/trends`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { year, currency }
      });

      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error("Failed to fetch monthly trends:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch monthly trends");
   }
};
