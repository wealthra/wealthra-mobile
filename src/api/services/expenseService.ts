import axiosInstance from "../axiosInstance";
import { getStoredToken, getUserId } from "./authService";
import {
  ExpenseDto,
  PaginatedListOfExpenseDto,
  CreateExpenseCommand,
  UpdateExpenseCommand,
  ExpenseSummaryDto,
  ExpenseGeneralInfoDto,
} from "../types";

export const getExpenses = async (
  pageNumber: number = 1,
  pageSize: number = 10,
): Promise<PaginatedListOfExpenseDto> => {
  try {
    const token = await getStoredToken();
    if (!token) throw new Error("No authentication token found");

    const userId = await getUserId();
    const params = { PageNumber: pageNumber, PageSize: pageSize };

    console.log("Fetching expenses:", params);

    const response = await axiosInstance.get<PaginatedListOfExpenseDto>(
      `/api/Expenses`,
      {
        params,
      },
    );

    console.log("Expense API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch expenses:", {
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
    } as PaginatedListOfExpenseDto;
  }
};

export const addExpense = async (expense: {
  description: string;
  amount: number;
  paymentMethod: string;
  isRecurring: boolean;
  categoryId: number;
}): Promise<number> => {
  try {
    const token = await getStoredToken();
    if (!token) throw new Error("No authentication token found");

    const requestData: CreateExpenseCommand = {
      description: expense.description,
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      isRecurring: Boolean(expense.isRecurring),
      categoryId: Number(expense.categoryId),
    };

    console.log(
      "Adding expense with data:",
      JSON.stringify(requestData, null, 2),
    );

    const response = await axiosInstance.post<number>(
      `/api/Expenses`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Add expense success:", response.status, response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to add expense:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const errorMessage =
      error.response?.data?.Message ||
      error.response?.data?.message ||
      "Failed to add expense";
    throw new Error(errorMessage);
  }
};

export const deleteExpense = async (id: number): Promise<void> => {
  try {
    const token = await getStoredToken();
    if (!token) throw new Error("No authentication token found");

    await axiosInstance.delete(`/api/Expenses/${id}`);
  } catch (error: any) {
    console.error("Failed to delete expense:", {
      error: error.message,
      response: error.response?.data,
    });
    throw new Error(
      error.response?.data?.message || "Failed to delete expense",
    );
  }
};

export const updateExpense = async (
  id: number,
  expense: {
    description?: string;
    amount?: number;
    paymentMethod?: string;
    isRecurring?: boolean;
    categoryId?: number;
    transactionDate?: string;
  },
): Promise<void> => {
  try {
    const token = await getStoredToken();
    if (!token) throw new Error("No authentication token found");

    const requestData: UpdateExpenseCommand = {
      id,
      ...expense,
    };

    await axiosInstance.put(`/api/Expenses/${id}`, requestData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(`Successfully updated expense with ID: ${id}`);
  } catch (error: any) {
    console.error(`Failed to update expense ${id}:`, error);
    throw new Error(
      error.response?.data?.message || "Failed to update expense",
    );
  }
};

export const getExpenseSummary = async (): Promise<ExpenseSummaryDto> => {
  try {
    const token = await getStoredToken();
    if (!token) throw new Error("No authentication token found");

    const response = await axiosInstance.get<ExpenseSummaryDto>(
      `/api/Expenses/summary`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch expense summary:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch expense summary",
    );
  }
};

export const getExpenseGeneralInfo =
  async (): Promise<ExpenseGeneralInfoDto> => {
    try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const response = await axiosInstance.get<ExpenseGeneralInfoDto>(
        `/api/Expenses/general-info`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch expense general info:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch expense general info",
      );
    }
  };

export const bulkAddExpenses = async (
  expenses: CreateExpenseCommand[],
): Promise<void> => {
  try {
    const token = await getStoredToken();
    if (!token) throw new Error("No authentication token found");

    console.log(`Adding ${expenses.length} expenses in bulk`);

    const response = await axiosInstance.post(`/api/Expenses/bulk`, expenses, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Bulk add expenses success:", response.status, response.data);
  } catch (error: any) {
    console.error("Failed to add expenses in bulk:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const errorMessage =
      error.response?.data?.Message ||
      error.response?.data?.message ||
      "Failed to add expenses in bulk";
    throw new Error(errorMessage);
  }
};

export const extractExpenseFromImage = async (
  imageUri: string,
  mimeType: string = "image/jpeg",
  fileName: string = "receipt.jpg",
): Promise<ExpenseDto[]> => {
  try {
    const token = await getStoredToken();
    if (!token) throw new Error("No authentication token found");

    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: mimeType,
      name: fileName,
    } as any);

    console.log("Extracting expenses from image:", fileName);

    const response = await axiosInstance.post<ExpenseDto[]>(
      "/api/Expenses/extract-from-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    console.log("Extract expenses from image success:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to extract expense from image:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const errorMessage =
      error.response?.data?.Message ||
      error.response?.data?.message ||
      "Failed to extract expense from image";
    throw new Error(errorMessage);
  }
};

export const extractExpenseFromAudio = async (
  audioUri: string,
  mimeType: string = "audio/mpeg",
  fileName: string = "expense-note.mp3",
): Promise<ExpenseDto[]> => {
  try {
    const token = await getStoredToken();
    if (!token) throw new Error("No authentication token found");

    const formData = new FormData();
    formData.append("file", {
      uri: audioUri,
      type: mimeType,
      name: fileName,
    } as any);

    console.log("Extracting expenses from audio:", fileName);

    const response = await axiosInstance.post<ExpenseDto[]>(
      "/api/Expenses/extract-from-audio",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    console.log("Extract expenses from audio success:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to extract expense from audio:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const errorMessage =
      error.response?.data?.Message ||
      error.response?.data?.message ||
      "Failed to extract expense from audio";
    throw new Error(errorMessage);
  }
};
