import axiosInstance from "../axiosInstance";
import { getStoredToken, getUserId, getStoredCurrency } from "./authService";
import { getUserCategories } from "./categoryService";
import { BudgetDto, CreateBudgetCommand, UpdateBudgetCommand, BudgetOverviewDto, MonthlyBudgetSummaryDto, PaginatedListOfBudgetDto, BudgetAlertDto } from "../types";
import { roundFinancialData } from "../../utils/roundingUtils";

export const getBudgets = async (pageNumber: number = 1, pageSize: number = 10, currencyOverride?: string): Promise<PaginatedListOfBudgetDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const userId = await getUserId();
      const currency = currencyOverride || await getStoredCurrency();
      const params = { PageNumber: pageNumber, PageSize: pageSize, currency };

      console.log("Fetching budgets with params:", params);

      const response = await axiosInstance.get<PaginatedListOfBudgetDto>(`/api/Budgets`, {
         headers: {
            "Content-Type": "application/json",
         },
         params,
      });

      console.log("Budget API Response:", response.data);

      // Normalize response if it's an array instead of a PaginatedListOfBudgetDto object
      let normalizedData: PaginatedListOfBudgetDto;
      if (Array.isArray(response.data)) {
         normalizedData = {
            items: response.data,
            pageNumber: 1,
            totalPages: 1,
            totalCount: response.data.length,
            hasNextPage: false,
            hasPreviousPage: false,
         };
      } else {
         normalizedData = response.data;
      }

      if (normalizedData.items && normalizedData.items.length > 0 && !normalizedData.items[0].categoryName) {
         const categoriesResponse = await getUserCategories();
         // Handle regular array returned from getUserCategories
         const categories = categoriesResponse || [];

         normalizedData.items = normalizedData.items.map((budget: BudgetDto) => {
            const category = categories.find((c: any) => 
               (c.categoryName || c.name || '').toLowerCase() === budget.categoryName?.toLowerCase() || 
               c.id === budget.categoryId
            );
            return {
               ...budget,
               categoryName: category ? (category.categoryName || category.name || `Category ${budget.categoryId}`) : `Category ${budget.categoryId}`,
            };
         });
      }

      return roundFinancialData(normalizedData);
   } catch (error: any) {
      console.error("Failed to fetch budgets:", {
         error: error.message,
         response: error.response?.data,
      });

      return {
         pageNumber,
         totalPages: 0,
         items: [],
         hasNextPage: false,
         hasPreviousPage: false,
         totalCount: 0,
      } as PaginatedListOfBudgetDto;
   }
};

export const addBudget = async (budget: {
   category: string;
   budgetLimit: number;
   currentAmount?: number;
   currency?: string;
}): Promise<number> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const categoriesResponse = await getUserCategories();
      const categories = categoriesResponse || [];

      const categoryMatch = categories.find((c: any) => (c.name || '').toLowerCase() === budget.category.toLowerCase());

      if (!categoryMatch) {
         throw new Error(`Category '${budget.category}' not found`);
      }

      const requestData: CreateBudgetCommand = {
         limitAmount: budget.budgetLimit,
         categoryId: categoryMatch.id,
         currency: budget.currency,
      };

      console.log("Adding budget with API format:", JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.post<number>(`/api/Budgets`, requestData, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to add budget:", {
         error: error.message,
         response: error.response?.data,
      });
      throw new Error(error.response?.data?.message || "Failed to add budget");
   }
};

export const getBudgetById = async (id: number, currencyOverride?: string): Promise<BudgetDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      const response = await axiosInstance.get<BudgetDto>(`/api/Budgets/${id}`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error(`Failed to fetch budget ${id}:`, error);
      throw new Error(error.response?.data?.message || `Failed to fetch budget ${id}`);
   }
};

export const deleteBudget = async (id: number): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      await axiosInstance.delete(`/api/Budgets/${id}`);
      console.log(`Successfully deleted budget with ID: ${id}`);
   } catch (error: any) {
      console.error("Failed to delete budget:", {
         error: error.message,
         response: error.response?.data,
      });
      throw new Error(error.response?.data?.message || "Failed to delete budget");
   }
};

export const updateBudget = async (
   id: number,
   budget: {
      budgetLimit: number;
      currency?: string;
   }
): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const requestData: UpdateBudgetCommand = {
         id,
         limitAmount: budget.budgetLimit,
         currency: budget.currency,
      };

      console.log(`Updating budget ${id}:`, JSON.stringify(requestData, null, 2));

      await axiosInstance.put(`/api/Budgets/${id}`, requestData, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      console.log(`Successfully updated budget with ID: ${id}`);
   } catch (error: any) {
      console.error("Failed to update budget:", {
         error: error.message,
         response: error.response?.data,
      });
      throw new Error(error.response?.data?.message || "Failed to update budget");
   }
};

export const getBudgetOverview = async (currencyOverride?: string): Promise<BudgetOverviewDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      const response = await axiosInstance.get<BudgetOverviewDto>(`/api/Budgets/overview`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      console.log("Budget Overview Data:", response.data);
      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error("Failed to fetch budget overview:", {
         error: error.message,
         response: error.response?.data,
      });

      throw new Error(error.response?.data?.message || "Failed to fetch budget overview");
   }
};


export const getMonthlyBudgetSummary = async (currencyOverride?: string): Promise<MonthlyBudgetSummaryDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      const response = await axiosInstance.get<MonthlyBudgetSummaryDto>(`/api/Budgets/monthly`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      console.log("Monthly Budget Summary:", response.data);
      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error("Failed to fetch monthly budget summary:", {
         error: error.message,
         response: error.response?.data,
      });

      throw new Error(error.response?.data?.message || "Failed to fetch monthly budget summary");
   }
};
