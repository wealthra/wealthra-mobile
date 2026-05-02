import axiosInstance from "../axiosInstance";
import { getStoredToken, getUserId, getStoredCurrency } from "./authService";
import { GoalDto, PaginatedListOfGoalHistoryDto, CreateGoalCommand, UpdateGoalCommand, GoalsTotalDto } from "../types";

export const getGoals = async (pageNumber: number = 1, pageSize: number = 10): Promise<PaginatedListOfGoalHistoryDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const userId = await getUserId();
      const currency = await getStoredCurrency();
      const params = { PageNumber: pageNumber, PageSize: pageSize, currency };

      console.log("Fetching goals with params:", params);

      const response = await axiosInstance.get<PaginatedListOfGoalHistoryDto>(`/api/Goals/user`, {
         headers: {
            "Content-Type": "application/json",
         },
         params,
      });

      console.log("Goals API Response:", response.data);
      return response.data;
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

export const getGoalsTotal = async (): Promise<GoalsTotalDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const currency = await getStoredCurrency();
      const response = await axiosInstance.get<GoalsTotalDto>(`/api/Goals/total`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { currency }
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch goals total:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch goals total");
   }
};
