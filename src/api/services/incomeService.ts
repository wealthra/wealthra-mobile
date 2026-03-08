import axiosInstance from "../axiosInstance";
import { getStoredToken, getUserId } from "./authService";
import { IncomeDto, PaginatedListOfIncomeDto, CreateIncomeCommand, UpdateIncomeCommand, IncomeSummaryDto, IncomeGeneralInfoDto } from "../types";

export const getIncomes = async (pageNumber: number = 1, pageSize: number = 10): Promise<PaginatedListOfIncomeDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const userId = await getUserId();
      const params = { PageNumber: pageNumber, PageSize: pageSize };

      console.log("Fetching incomes:", params);

      const response = await axiosInstance.get<PaginatedListOfIncomeDto>(`/api/Incomes`, {
         params,
      });

      console.log("Income API Response:", response.data);
      return response.data;
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

export const addIncome = async (income: { name: string; amount: number; method: string; isRecurring: boolean }): Promise<number> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const requestData: CreateIncomeCommand = {
         name: income.name,
         amount: income.amount,
         method: income.method,
         isRecurring: income.isRecurring,
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

export const getIncomeSummary = async (): Promise<IncomeSummaryDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const response = await axiosInstance.get<IncomeSummaryDto>(`/api/Incomes/summary`, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch income summary:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch income summary");
   }
};

export const getIncomeGeneralInfo = async (): Promise<IncomeGeneralInfoDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const response = await axiosInstance.get<IncomeGeneralInfoDto>(`/api/Incomes/generalinfo`, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch income general info:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch income general info");
   }
};
