import axiosInstance from "../axiosInstance";
import { getStoredToken, getUserId, getStoredCurrency } from "./authService";
import { GoalDto, PaginatedListOfGoalHistoryDto, CreateGoalCommand, UpdateGoalCommand, GoalsTotalDto } from "../types";
import { roundFinancialData } from "../../utils/roundingUtils";

export const getGoals = async (pageNumber: number = 1, pageSize: number = 10, currencyOverride?: string): Promise<PaginatedListOfGoalHistoryDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const userId = await getUserId();
      const currency = currencyOverride || await getStoredCurrency();
      const params = { PageNumber: pageNumber, PageSize: pageSize, currency };

      console.log("Fetching goals with params:", params);

      const response = await axiosInstance.get<any>(`/api/Goals`, {
         headers: {
            "Content-Type": "application/json",
         },
         params,
      });

      // Normalize and round values
      let items = Array.isArray(response.data) ? response.data : (response.data.items || []);
      
      // Round all values using central utility
      items = roundFinancialData(items);

      if (Array.isArray(response.data)) {
         return {
            items: items,
            pageNumber: 1,
            totalPages: 1,
            totalCount: items.length,
            hasNextPage: false,
            hasPreviousPage: false,
         } as PaginatedListOfGoalHistoryDto;
      }

      return {
         ...response.data,
         items: items
      };
   } catch (error: any) {
      console.error("Failed to fetch goals:", {
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
      } as PaginatedListOfGoalHistoryDto;
   }
};

export const addGoal = async (goal: {
   name: string;
   targetAmount: number;
   initialAmount: number;
   daysToTarget: number;
   currency?: string;
}): Promise<number> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + goal.daysToTarget);

      const formattedDeadline = deadline.toISOString().split("T")[0];

      const requestData: CreateGoalCommand = {
         name: goal.name,
         targetAmount: goal.targetAmount,
         currentAmount: goal.initialAmount,
         deadline: formattedDeadline,
         currency: goal.currency,
      };

      console.log("Adding goal with API format:", JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.post<number>(`/api/Goals`, requestData, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to add goal:", {
         error: error.message,
         response: error.response?.data,
      });

      throw new Error(error.response?.data?.message || "Failed to add goal");
   }
};

export const getGoalById = async (id: number, currencyOverride?: string): Promise<GoalDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      const response = await axiosInstance.get<GoalDto>(`/api/Goals/${id}`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error(`Failed to fetch goal ${id}:`, error);
      throw new Error(error.response?.data?.message || `Failed to fetch goal ${id}`);
   }
};

export const deleteGoal = async (id: number): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      await axiosInstance.delete(`/api/Goals/${id}`);
      console.log(`Successfully deleted goal with ID: ${id}`);
   } catch (error: any) {
      console.error("Failed to delete goal:", {
         error: error.message,
         response: error.response?.data,
      });
      throw new Error(error.response?.data?.message || "Failed to delete goal");
   }
};

export const updateGoal = async (
   id: number,
   goal: {
      name: string;
      targetAmount: number;
      initialAmount: number;
      daysToTarget?: number;
      currentAmount?: number;
      currency?: string;
   }
): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      let deadlineDate: Date;
      if (goal.daysToTarget !== undefined) {
         deadlineDate = new Date();
         deadlineDate.setDate(deadlineDate.getDate() + goal.daysToTarget);
      } else {
         try {
            const currentGoalResponse = await axiosInstance.get<GoalDto>(`/api/Goals/${id}`);
            deadlineDate = new Date(currentGoalResponse.data.deadline || new Date().toISOString());
         } catch (err) {
            console.error("Failed to fetch current goal deadline:", err);
            deadlineDate = new Date();
            deadlineDate.setDate(deadlineDate.getDate() + 30);
         }
      }

      const formattedDeadline = deadlineDate.toISOString().split("T")[0];

      const requestData: UpdateGoalCommand = {
         id,
         name: goal.name,
         targetAmount: goal.targetAmount,
         currentAmount: goal.currentAmount !== undefined ? goal.currentAmount : goal.initialAmount,
         deadline: formattedDeadline,
         currency: goal.currency,
      };

      console.log(`Updating goal ${id}:`, JSON.stringify(requestData, null, 2));

      await axiosInstance.put(`/api/Goals/${id}`, requestData, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      console.log(`Successfully updated goal with ID: ${id}`);
   } catch (error: any) {
      console.error("Failed to update goal:", {
         error: error.message,
         response: error.response?.data,
      });

      if (error.response?.data?.errors) {
         const validationErrors = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("; ");
         throw new Error(`Validation failed: ${validationErrors}`);
      }

      throw new Error(error.response?.data?.message || "Failed to update goal");
   }
};

export const calculateDaysRemaining = (deadlineDate: string): number => {
   const today = new Date();
   today.setHours(0, 0, 0, 0);

   const deadline = new Date(deadlineDate);
   deadline.setHours(0, 0, 0, 0);

   const differenceInTime = deadline.getTime() - today.getTime();
   const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

   return Math.max(0, differenceInDays);
};

export const getGoalsTotal = async (currencyOverride?: string): Promise<GoalsTotalDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = currencyOverride || await getStoredCurrency();
      const response = await axiosInstance.get<GoalsTotalDto>(`/api/Goals/total`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      return roundFinancialData(response.data);
   } catch (error: any) {
      console.error("Failed to fetch goals total:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch goals total");
   }
};
