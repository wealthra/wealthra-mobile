import axiosInstance from "../axiosInstance";
import { getStoredToken, getUserId, getStoredCurrency } from "./authService";
import { IncomeDto, PaginatedListOfIncomeDto, CreateIncomeCommand, UpdateIncomeCommand, IncomeSummaryDto, IncomeGeneralInfoDto } from "../types";
import { roundFinancialData } from "../../utils/roundingUtils";

export const getIncomes = async (pageNumber: number = 1, pageSize: number = 10, currencyOverride?: string): Promise<PaginatedListOfIncomeDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const userId = await getUserId();
      const currency = currencyOverride || await getStoredCurrency();
      const params = { PageNumber: pageNumber, PageSize: pageSize, currency };

      console.log("Fetching incomes:", params);

      console.log(`🚀 [DEBUG] Fetching incomes for currency: ${currency}`);
      const response = await axiosInstance.get<PaginatedListOfIncomeDto>(`/api/Incomes`, {
         params,
      });

      console.log("✅ [DEBUG] Income List API Response:", JSON.stringify(response.data, null, 2));
      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error("Failed to fetch incomes:", error);
      return {
         pageNumber,
         totalPages: 0,
         items: [],
         hasNextPage: false,
         hasPreviousPage: false,
         totalCount: 0,
      } as PaginatedListOfIncomeDto;
   }
};

export const addIncome = async (income: { name: string; amount: number; method: string; isRecurring: boolean; currency?: string; transactionDate?: string }): Promise<number> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const requestData: CreateIncomeCommand = {
         name: income.name,
         amount: income.amount,
         method: income.method,
         isRecurring: income.isRecurring,
         currency: income.currency,
         transactionDate: income.transactionDate,
      };

      console.log("Adding income:", JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.post<number>(`/api/Incomes`, requestData, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      console.log("Add Income API Response:", response.data);
      return response.data;
   } catch (error: any) {
      console.error("Failed to add income:", error);
      throw new Error(error.response?.data?.message || "Failed to add income");
   }
};

export const getIncomeById = async (id: number, currencyOverride?: string): Promise<IncomeDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      const response = await axiosInstance.get<IncomeDto>(`/api/Incomes/${id}`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error(`Failed to fetch income ${id}:`, error);
      throw new Error(error.response?.data?.message || `Failed to fetch income ${id}`);
   }
};

export const deleteIncome = async (id: number): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      await axiosInstance.delete(`/api/Incomes/${id}`);
      console.log(`Successfully deleted income with ID: ${id}`);
   } catch (error: any) {
      console.error("Failed to delete income:", error);
      throw new Error(error.response?.data?.message || "Failed to delete income");
   }
};

export const updateIncome = async (id: number, income: {
   name?: string;
   amount?: number;
   method?: string;
   isRecurring?: boolean;
   transactionDate?: string;
   currency?: string;
}): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const requestData: UpdateIncomeCommand = {
         id,
         ...income
      };

      await axiosInstance.put(`/api/Incomes/${id}`, requestData, {
         headers: {
            "Content-Type": "application/json",
         },
      });
      console.log(`Successfully updated income with ID: ${id}`);
   } catch (error: any) {
      console.error(`Failed to update income ${id}:`, error);
      throw new Error(error.response?.data?.message || "Failed to update income");
   }
};

export const getIncomeSummary = async (currencyOverride?: string): Promise<IncomeSummaryDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      console.log(`🚀 [DEBUG] Fetching income summary for currency: ${currency}`);
      const response = await axiosInstance.get<IncomeSummaryDto>(`/api/Incomes/summary`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      console.log("✅ [DEBUG] Income Summary API Response:", JSON.stringify(response.data, null, 2));
      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error("Failed to fetch income summary:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch income summary");
   }
};

export const getIncomeGeneralInfo = async (currencyOverride?: string): Promise<IncomeGeneralInfoDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      const response = await axiosInstance.get<IncomeGeneralInfoDto>(`/api/Incomes/generalinfo`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error("Failed to fetch income general info:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch income general info");
   }
};
