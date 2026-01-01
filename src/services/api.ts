import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Setup axios defaults to properly encode URIs
axios.defaults.paramsSerializer = (params) => {
   return Object.entries(params)
      .map(([key, value]) => {
         // Ensure proper encoding of special characters
         return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
      })
      .join("&");
};

// Update this with your Swagger base URL
export const API_URL = "http://192.168.45.20:16400";
export const API_VERSION = "1";

interface LoginResponse {
   id: string;
   userName: string;
   email: string;
   roles: string[];
   isVerified: boolean;
   jwToken: string;
}

interface ForgotPasswordResponse {
   to: string;
   subject: string;
   body: string;
   from: string | null;
}

interface RegisterRequest {
   firstName: string;
   lastName: string;
   email: string;
   password: string;
   confirmPassword: string;
}

export interface TopSpendingCategory {
   categoryId: number;
   categoryName: string;
   totalAmount: number;
}

export interface FinancialSummary {
   firstName: string;
   totalBalance: number;
   lastMonthBalance: number;
   currentMonthSpending: number;
   lastMonthSpending: number;
   totalRecurringExpenses: number;
   topSpendingCategories: TopSpendingCategory[];
   latestGoal: SavingGoal;
   goalProgress: number;
   categorySpending: {
      [key: string]: number;
   };
   monthlyExpensesLastYear: {
      [key: string]: number;
   };
   monthlyIncomesLastYear: {
      [key: string]: number;
   };
}

interface SavingGoal {
   id: number;
   createdBy: string;
   created: string;
   lastModifiedBy: string;
   lastModified: string;
   name: string;
   targetAmount: number;
   initialAmount: number;
   deadline: string;
}

export interface Income {
   id: number;
   name: string;
   amount: number;
   method: string;
   isRecurring: boolean;
   userId: string;
}

interface IncomeResponse {
   pageNumber: number;
   pageSize: number;
   data: Income[];
}

interface Expense {
   id: number;
   description: string;
   amount: number;
   paymentMethod: string;
   isRecurring: boolean;
   categoryId: number;
   categoryName: string;
}

interface ExpenseResponse {
   pageNumber: number;
   pageSize: number;
   data: Expense[];
}

interface CategoryResponse {
   pageNumber: number;
   pageSize: number;
   data: Category[];
}

interface Category {
   id: number;
   name: string; // Changed from CategoryTranslation to string
}

// Define the categories with translations separately
const CATEGORY_TRANSLATIONS: Record<string, { en: string; tr: string }> = {
   Food: { en: "Food", tr: "Yemek" },
   Housing: { en: "Housing", tr: "Konut" },
   Entertainment: { en: "Entertainment", tr: "Eğlence" },
   Healthcare: { en: "Healthcare", tr: "Sağlık" },
   Education: { en: "Education", tr: "Eğitim" },
   Transport: { en: "Transport", tr: "Ulaşım" },
   Shopping: { en: "Shopping", tr: "Alışveriş" },
   Other: { en: "Other", tr: "Diğer" },
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
   try {
      const url = `${API_URL}/api/Account/authenticate`;

      const response = await axios.post<LoginResponse>(url, {
         email,
         password,
      });

      // Store user data in AsyncStorage
      await AsyncStorage.multiSet([
         ["userId", response.data.id],
         ["jwToken", response.data.jwToken],
         ["userRoles", JSON.stringify(response.data.roles)],
      ]);

      return response.data;
   } catch (error: any) {
      console.error("API Request failed:", {
         url: `${API_URL}/api/Account/authenticate`,
         error: error.message,
         response: error.response?.data,
      });
      if (error.response) {
         throw new Error(error.response.data.message || "Login failed");
      }
      throw new Error("Network error occurred");
   }
};

export const updateUserProfile = async (profileData: { userId: string; firstName: string; lastName: string; email: string }): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      console.log("Updating user profile with data:", {
         ...profileData,
         // Don't mask these fields as they're not sensitive
      });

      // Use the exact URL from your curl example
      const url = `${API_URL}/api/Account/update-user`;

      const response = await axios.put(url, profileData, {
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
      });

      console.log("Profile update successful:", response.status);
      return;
   } catch (error: any) {
      console.error("Failed to update profile:", {
         error: error.message,
         status: error.response?.status,
         data: error.response?.data,
      });

      // Handle specific error cases
      if (error.response?.status === 409) {
         throw new Error(error.response.data.message || "Email is already in use");
      }

      const errorMessage = error.response?.data?.Message || error.response?.data?.message || "Failed to update profile";
      throw new Error(errorMessage);
   }
};

export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
   try {
      const url = `${API_URL}/api/Account/forgot-password`;

      const response = await axios.post<ForgotPasswordResponse>(url, {
         email: email,
      });

      return response.data;
   } catch (error: any) {
      console.error("API Request failed:", {
         url: `${API_URL}/api/Account/forgot-password`,
         error: error.message,
         response: error.response?.data,
         status: error.response?.status,
      });
      if (error.response) {
         throw new Error(error.response.data.message || "Forgot password failed");
      }
      throw new Error("Network error occurred");
   }
};

// Update the signUp function in api.ts to better handle 400 status codes
export const signUp = async (firstName: string, surname: string, email: string, password: string): Promise<RegisterRequest | null> => {
   try {
      const url = `${API_URL}/api/Account/register`;

      // Don't log the actual password
      console.log("Sending registration request:", {
         firstName,
         lastName: surname,
         email,
         password: "********",
      });

      // Create request payload
      const requestData = {
         firstName,
         lastName: surname,
         email,
         password,
         confirmPassword: password,
      };

      // Make the request
      const response = await axios.post<RegisterRequest | string>(url, requestData, {
         headers: {
            "Content-Type": "application/json",
         },
         // Only treat 500 responses with confirmation message as successful, not 400
         validateStatus: function (status) {
            return (status >= 200 && status < 300) || status === 500;
         },
         // Get the response as text to properly handle the HTML/text response
         responseType: "text",
      });

      // Check if the response contains a confirmation URL (success with email verification)
      if (
         response.data &&
         typeof response.data === "string" &&
         (response.data.includes("User Registered") || response.data.includes("confirm-email"))
      ) {
         console.log("Registration successful with email confirmation required");

         // Return a successful response with the original request data
         return {
            firstName,
            lastName: surname,
            email,
            password: "REDACTED",
            confirmPassword: "REDACTED",
         };
      }

      // If we get here, it's a normal success response
      console.log("Registration successful");

      // Handle JSON or string response appropriately
      const responseData =
         typeof response.data === "string"
            ? {
                 firstName,
                 lastName: surname,
                 email,
                 password: "REDACTED",
                 confirmPassword: "REDACTED",
              }
            : (response.data as RegisterRequest);

      return responseData;
   } catch (error: any) {
      // Check specifically for 400 status code - likely a duplicate email
      if (error.response?.status === 400) {
         // Log the error but don't throw it
         console.log("Registration failed with 400 status - likely duplicate email");

         // Return null instead of throwing an error
         return null;
      }

      // Log the error but don't throw it if it's a registration failure
      if (error.message.includes("Registration failed")) {
         console.log("Registration error:", error.message);
         return null;
      }

      // For other errors, log them but don't throw (to prevent red screen)
      console.error("Registration failed:", error.response?.data);
      console.error("Sign Up error details:", {
         message: error.message,
         status: error.response?.status,
         response: error.response?.data,
      });

      // Return null instead of throwing
      return null;
   }
};

// Helper function to get stored token
export const getStoredToken = async (): Promise<string | null> => {
   return await AsyncStorage.getItem("jwToken");
};

// Helper function to get stored user ID
export const getStoredUserId = async (): Promise<string | null> => {
   return await AsyncStorage.getItem("userId");
};

// Helper function to clear stored auth data (for logout)
export const clearAuthData = async (): Promise<void> => {
   await AsyncStorage.multiRemove(["userId", "jwToken", "userRoles"]);
};

export const getFinancialSummary = async (): Promise<FinancialSummary> => {
   try {
      const token = await getStoredToken();
      const userId = await getStoredUserId();

      if (!token || !userId) {
         throw new Error("No authentication token or user ID found");
      }

      const url = `${API_URL}/api/v${API_VERSION}/FinancialSummary/user/${userId}`;

      const response = await axios.get<FinancialSummary>(url, {
         headers: {
            Authorization: `Bearer ${token}`,
         },
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch financial summary:", {
         error: error.message,
         response: error.response?.data,
      });
      throw new Error(error.response?.data?.message || "Failed to fetch financial summary");
   }
};

export const getIncomes = async (pageNumber: number = 1, pageSize: number = 3): Promise<IncomeResponse> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get the user ID from the token
      const userId = await getUserId();

      // Use the correct API endpoint format
      const url = `${API_URL}/api/v${API_VERSION}/Income/user/${userId}`;
      const params = { PageNumber: pageNumber, PageSize: pageSize };

      console.log("Fetching incomes from:", url, params);

      const response = await axios.get<IncomeResponse>(url, {
         headers: {
            Authorization: `Bearer ${token}`,
         },
         params,
      });

      console.log("Income API Response:", response.data);
      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch incomes:", error);
      // Return empty response on error
      return {
         pageNumber,
         pageSize,
         data: [],
      };
   }
};

export const addIncome = async (income: { name: string; amount: number; method: string; isRecurring: boolean }): Promise<number> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get the user ID from the token
      const userId = await getUserId();

      const requestData = {
         name: income.name,
         amount: income.amount,
         method: income.method,
         isRecurring: income.isRecurring,
         userId: userId,
      };

      console.log("Adding income:", JSON.stringify(requestData, null, 2));

      const response = await axios.post<number>(`${API_URL}/api/v${API_VERSION}/Income`, requestData, {
         headers: {
            Authorization: `Bearer ${token}`,
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
      if (!token) {
         throw new Error("No authentication token found");
      }

      await axios.delete(`${API_URL}/api/v${API_VERSION}/Income/${id}`, {
         headers: {
            Authorization: `Bearer ${token}`,
         },
      });

      console.log(`Successfully deleted income with ID: ${id}`);
   } catch (error: any) {
      console.error("Failed to delete income:", error);
      throw new Error(error.response?.data?.message || "Failed to delete income");
   }
};

export const getExpenses = async (pageNumber: number = 1, pageSize: number = 10): Promise<ExpenseResponse> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get the user ID from the token
      const userId = await getUserId();

      // Update URL to match your curl example
      const url = `${API_URL}/api/v${API_VERSION}/Expense/user/${userId}`;
      const params = { PageNumber: pageNumber, PageSize: pageSize }; // Note the capital P in PageNumber and PageSize

      console.log("Fetching expenses from:", url, params);

      const response = await axios.get<ExpenseResponse>(url, {
         headers: {
            Authorization: `Bearer ${token}`,
         },
         params,
      });

      console.log("Expense API Response:", response.data);
      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch expenses:", {
         error: error.message,
         response: error.response?.data,
      });

      // Return empty response on error
      return {
         pageNumber,
         pageSize,
         data: [],
      };
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
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get the user ID from the token
      const userId = await getUserId();

      // Ensure all properties are correctly formatted
      const requestData = {
         description: expense.description,
         amount: Number(expense.amount), // Ensure amount is a number
         paymentMethod: expense.paymentMethod,
         isRecurring: Boolean(expense.isRecurring), // Ensure boolean
         categoryId: Number(expense.categoryId), // Ensure number
         userId: userId,
      };

      console.log("Adding expense with data:", JSON.stringify(requestData, null, 2));

      // Make the API call with more detailed logging
      const response = await axios.post<number>(`${API_URL}/api/v${API_VERSION}/Expense`, requestData, {
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
      });

      console.log("Add expense success:", response.status, response.data);
      return response.data;
   } catch (error: any) {
      // More detailed error logging
      console.error("Failed to add expense:", {
         error: error.message,
         status: error.response?.status,
         data: error.response?.data,
         requestUrl: `${API_URL}/api/v${API_VERSION}/Expense`,
      });

      // Check if we have a more specific error message from the server
      const errorMessage = error.response?.data?.Message || error.response?.data?.message || "Failed to add expense";

      throw new Error(errorMessage);
   }
};

export const deleteExpense = async (id: number): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      await axios.delete(`${API_URL}/api/v${API_VERSION}/Expense/${id}`, {
         headers: {
            Authorization: `Bearer ${token}`,
         },
      });
   } catch (error: any) {
      console.error("Failed to delete expense:", {
         error: error.message,
         response: error.response?.data,
      });
      throw new Error(error.response?.data?.message || "Failed to delete expense");
   }
};

export const getUserCategories = async (pageNumber: number = 1, pageSize: number = 8): Promise<CategoryResponse> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      const url = `${API_URL}/api/v${API_VERSION}/Category/users`;
      const params = { pageNumber, pageSize };

      console.log("Fetching categories from:", url);

      const response = await axios.get<CategoryResponse>(url, {
         headers: {
            Authorization: `Bearer ${token}`,
         },
         params,
      });

      // If API returns empty data, use default categories
      if (!response.data.data || response.data.data.length === 0) {
         console.log("Using default categories");
         return {
            pageNumber: 1,
            pageSize: 8,
            data: [
               { id: 1, name: "Food" },
               { id: 2, name: "Housing" },
               { id: 3, name: "Entertainment" },
               { id: 4, name: "Healthcare" },
               { id: 5, name: "Education" },
               { id: 6, name: "Transport" },
               { id: 7, name: "Shopping" },
               { id: 8, name: "Other" },
            ],
         };
      }

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch categories:", error);
      // Return default categories on error
      return {
         pageNumber: 1,
         pageSize: 8,
         data: [
            { id: 1, name: "Food" },
            { id: 2, name: "Housing" },
            { id: 3, name: "Entertainment" },
            { id: 4, name: "Healthcare" },
            { id: 5, name: "Education" },
            { id: 6, name: "Transport" },
            { id: 7, name: "Shopping" },
            { id: 8, name: "Other" },
         ],
      };
   }
};

export interface Budget {
   id: number;
   limitAmount: number; // Updated from budgetLimit
   currentAmount: number; // Updated from spent
   categoryId: number; // Added this field
   categoryName?: string; // Optional field that might come from the API
}

interface BudgetResponse {
   pageNumber: number;
   pageSize: number;
   data: Budget[];
   hasMoreItems: boolean;
   totalCount: number;
   totalPages: number;
}

interface AddBudgetRequest {
   limitAmount: number; // Changed from budgetLimit
   currentAmount: number; // Added this field
   categoryId: number; // Changed from category string to categoryId number
}

export const getBudgets = async (pageNumber: number = 1, pageSize: number = 10): Promise<BudgetResponse> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get the user ID from the token
      const userId = await getUserId();

      // Update URL to match your curl example with the correct path structure
      const url = `${API_URL}/api/v${API_VERSION}/Budget/user/${userId}`;

      // Params with correct casing
      const params = { PageNumber: pageNumber, PageSize: pageSize };

      console.log("Fetching budgets from:", url, "with params:", params);

      const response = await axios.get<BudgetResponse>(url, {
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
         params,
      });

      console.log("Budget API Response:", response.data);

      // If the response doesn't include category names, fetch categories to map IDs to names
      if (response.data.data.length > 0 && !response.data.data[0].categoryName) {
         const categoriesResponse = await getUserCategories();
         const categories = categoriesResponse.data;

         // Add category names to the budget data
         response.data.data = response.data.data.map((budget) => {
            const category = categories.find((c) => c.id === budget.categoryId);
            return {
               ...budget,
               categoryName: category ? category.name : `Category ${budget.categoryId}`,
            };
         });
      }

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch budgets:", {
         error: error.message,
         response: error.response?.data,
      });

      // Return empty response on error that matches the expected structure
      return {
         pageNumber,
         pageSize,
         data: [],
         hasMoreItems: false,
         totalCount: 0,
         totalPages: 0,
      };
   }
};

export const addBudget = async (budget: {
   category: string; // Keep accepting category name for UI simplicity
   budgetLimit: number; // Keep accepting budgetLimit for UI simplicity
   currentAmount?: number; // Optional current amount
}): Promise<number> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // First, get the category ID from the category name
      const categoriesResponse = await getUserCategories();
      const categories = categoriesResponse.data;

      // Find the matching category
      const categoryMatch = categories.find((c) => c.name.toLowerCase() === budget.category.toLowerCase());

      if (!categoryMatch) {
         throw new Error(`Category '${budget.category}' not found`);
      }

      // Transform to match API requirements
      const requestData: AddBudgetRequest = {
         limitAmount: budget.budgetLimit,
         currentAmount: budget.currentAmount || 0, // Default to 0 if not provided
         categoryId: categoryMatch.id,
      };

      console.log("Adding budget with API format:", JSON.stringify(requestData, null, 2));

      const response = await axios.post<number>(`${API_URL}/api/v${API_VERSION}/Budget`, requestData, {
         headers: {
            Authorization: `Bearer ${token}`,
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

export const deleteBudget = async (id: number): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      await axios.delete(`${API_URL}/api/v${API_VERSION}/Budget/${id}`, {
         headers: {
            Authorization: `Bearer ${token}`,
         },
      });

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
      category: string;
      budgetLimit: number;
      currentAmount?: number;
   }
): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get category ID from name
      const categoriesResponse = await getUserCategories();
      const categories = categoriesResponse.data;
      const categoryMatch = categories.find((c) => c.name.toLowerCase() === budget.category.toLowerCase());

      if (!categoryMatch) {
         throw new Error(`Category '${budget.category}' not found`);
      }

      // Transform to match API requirements
      const requestData: AddBudgetRequest = {
         limitAmount: budget.budgetLimit,
         currentAmount: budget.currentAmount || 0,
         categoryId: categoryMatch.id,
      };

      console.log(`Updating budget ${id}:`, JSON.stringify(requestData, null, 2));

      await axios.put(`${API_URL}/api/v${API_VERSION}/Budget/${id}`, requestData, {
         headers: {
            Authorization: `Bearer ${token}`,
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

// Add these interface definitions to your existing interfaces

export interface Goal {
   id: number;
   name: string;
   targetAmount: number;
   initialAmount: number;
   deadline: string;
}

interface GoalResponse {
   pageNumber: number;
   pageSize: number;
   data: Goal[];
   hasMoreItems?: boolean; // Make these optional since they might not always be present
   totalCount?: number;
   totalPages?: number;
}

interface AddGoalRequest {
   name: string;
   targetAmount: number;
   initialAmount: number;
   deadline: string;
}

// Add these API functions for handling goals

export const getGoals = async (pageNumber: number = 1, pageSize: number = 10): Promise<GoalResponse> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get the user ID from the token
      const userId = await getUserId();

      // Update URL to match your curl example with the correct path structure
      const url = `${API_URL}/api/v${API_VERSION}/Goal/user/${userId}`;

      // Add pagination parameters if your API supports them
      const params = { PageNumber: pageNumber, PageSize: pageSize };

      console.log("Fetching goals from:", url, "with params:", params);

      const response = await axios.get(url, {
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
         params,
      });

      console.log("Goals API Response:", response.data);

      // Handle different response structures
      let formattedResponse: GoalResponse;

      if (Array.isArray(response.data)) {
         // If the API returns an array directly
         formattedResponse = {
            pageNumber,
            pageSize,
            data: response.data,
         };
      } else if (response.data && typeof response.data === "object" && "data" in response.data && Array.isArray((response.data as any).data)) {
         // If the API returns the expected structure
         formattedResponse = response.data as GoalResponse;
      } else {
         // If the API returns something unexpected, default to empty data
         formattedResponse = {
            pageNumber,
            pageSize,
            data: [],
         };
      }

      return formattedResponse;
   } catch (error: any) {
      console.error("Failed to fetch goals:", {
         error: error.message,
         response: error.response?.data,
      });

      // Return empty response on error
      return {
         pageNumber,
         pageSize,
         data: [],
      };
   }
};

export const addGoal = async (goal: {
   name: string;
   targetAmount: number;
   initialAmount: number;
   daysToTarget: number; // We'll convert this to a deadline date
}): Promise<number> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Calculate deadline date based on daysToTarget
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + goal.daysToTarget);

      // Format the date in yyyy-MM-dd format (without time component)
      // This is likely what the API expects instead of ISO string with time
      const formattedDeadline = deadline.toISOString().split("T")[0];

      const requestData: AddGoalRequest = {
         name: goal.name,
         targetAmount: goal.targetAmount,
         initialAmount: goal.initialAmount,
         deadline: formattedDeadline, // Use the formatted date string
      };

      console.log("Adding goal with API format:", JSON.stringify(requestData, null, 2));

      const response = await axios.post<number>(`${API_URL}/api/v${API_VERSION}/Goal`, requestData, {
         headers: {
            Authorization: `Bearer ${token}`,
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
      if (!token) {
         throw new Error("No authentication token found");
      }

      await axios.delete(`${API_URL}/api/v${API_VERSION}/Goal/${id}`, {
         headers: {
            Authorization: `Bearer ${token}`,
         },
      });

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
      daysToTarget?: number; // Optional - only update deadline if provided
      currentAmount?: number; // Optional - to update progress
   }
): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Calculate new deadline date if daysToTarget is provided
      let deadlineDate: Date;
      if (goal.daysToTarget !== undefined) {
         deadlineDate = new Date();
         deadlineDate.setDate(deadlineDate.getDate() + goal.daysToTarget);
      } else {
         // If no daysToTarget provided, try to get the current goal's deadline
         try {
            const currentGoalResponse = await axios.get<Goal>(`${API_URL}/api/v${API_VERSION}/Goal/${id}`, {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            });
            deadlineDate = new Date(currentGoalResponse.data.deadline);
         } catch (err) {
            console.error("Failed to fetch current goal deadline:", err);
            // Default to 30 days from now if we can't get the current deadline
            deadlineDate = new Date();
            deadlineDate.setDate(deadlineDate.getDate() + 30);
         }
      }

      // Format the date in yyyy-MM-dd format (without time component)
      const formattedDeadline = deadlineDate.toISOString().split("T")[0];

      // Prepare update data
      const requestData: AddGoalRequest = {
         name: goal.name,
         targetAmount: goal.targetAmount,
         initialAmount: goal.initialAmount,
         deadline: formattedDeadline, // Use the formatted date string
      };

      console.log(`Updating goal ${id}:`, JSON.stringify(requestData, null, 2));

      // Use the correct API endpoint format
      const url = `${API_URL}/api/v${API_VERSION}/Goal/${id}`;

      await axios.put(url, requestData, {
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
      });

      console.log(`Successfully updated goal with ID: ${id}`);
   } catch (error: any) {
      console.error("Failed to update goal:", {
         error: error.message,
         response: error.response?.data,
      });

      // Include more detailed error information
      if (error.response?.data?.errors) {
         const validationErrors = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("; ");
         throw new Error(`Validation failed: ${validationErrors}`);
      }

      throw new Error(error.response?.data?.message || "Failed to update goal");
   }
};

// Helper function to calculate days between two dates
export const calculateDaysRemaining = (deadlineDate: string): number => {
   const today = new Date();
   today.setHours(0, 0, 0, 0);

   const deadline = new Date(deadlineDate);
   deadline.setHours(0, 0, 0, 0);

   const differenceInTime = deadline.getTime() - today.getTime();
   const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

   return Math.max(0, differenceInDays); // Ensure we don't return negative days
};

export const getUserId = async (): Promise<string> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Extract from JWT token
      const tokenParts = token.split(".");
      if (tokenParts.length === 3) {
         const payload = JSON.parse(atob(tokenParts[1]));
         if (payload.uid) {
            return payload.uid; // User ID is in the 'uid' field of the JWT
         }
      }

      throw new Error("Could not extract user ID from token");
   } catch (error) {
      console.error("Failed to get user ID:", error);
      throw new Error("Could not retrieve user ID");
   }
};

export const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get user ID from the token
      const userId = await getUserId();

      // Create request data matching the exact format from your curl example
      const requestData = {
         userId: userId,
         currentPassword: currentPassword,
         newPassword: newPassword,
         confirmPassword: confirmPassword,
      };

      console.log(
         "Changing password with data:",
         JSON.stringify(
            {
               ...requestData,
               currentPassword: "***HIDDEN***",
               newPassword: "***HIDDEN***",
               confirmPassword: "***HIDDEN***",
            },
            null,
            2
         )
      );

      // Use the exact URL from your curl example
      const url = `${API_URL}/api/Account/update-password`;

      const response = await axios.put(url, requestData, {
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
      });

      console.log("Password change successful:", response.status);
      return;
   } catch (error: any) {
      console.error("Failed to change password:", {
         error: error.message,
         status: error.response?.status,
         data: error.response?.data,
      });

      const errorMessage = error.response?.data?.Message || error.response?.data?.message || "Failed to change password";
      throw new Error(errorMessage);
   }
};

export interface UserInfo {
   userId: string;
   firstName: string;
   lastName: string;
   email: string;
   userName: string;
   roles: string[];
   isActive: boolean;
   isVerified: boolean;
}

export const getUserInfo = async (): Promise<UserInfo> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get the user ID from the token
      const userId = await getUserId();

      // Use the exact URL from the curl example
      const url = `${API_URL}/api/Account/user-info`;

      const response = await axios.get<UserInfo>(url, {
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
         params: {
            UserId: userId, // Note the capital U in UserId to match the API
         },
      });

      console.log("User info fetched successfully");
      return response.data;
   } catch (error: any) {
      console.error("Failed to get user information:", {
         error: error.message,
         status: error.response?.status,
         data: error.response?.data,
      });

      const errorMessage = error.response?.data?.message || "Failed to get user information";
      throw new Error(errorMessage);
   }
};

// Define the interface for category spending data
interface CategorySpending {
   categoryId: number;
   categoryName: string;
   totalAmount: number;
}

interface CategorySpendingResponse {
   categories: CategorySpending[];
   totalSpent: number;
}

/**
 * Fetches category spending data within a specified date range
 * @param startDate Start date in 'YYYY-MM-DD' format
 * @param endDate End date in 'YYYY-MM-DD' format
 * @returns Promise with category spending data
 */
export const getCategorySpendingByDateRange = async (startDate: string, endDate: string): Promise<CategorySpendingResponse> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get the user ID from the token
      const userId = await getUserId();

      // Format dates if they're Date objects
      const formattedStartDate = typeof startDate === "object" ? (startDate as Date).toISOString().split("T")[0] : startDate;

      const formattedEndDate = typeof endDate === "object" ? (endDate as Date).toISOString().split("T")[0] : endDate;

      // Build the query parameters
      const params = new URLSearchParams();
      params.append("startDate", formattedStartDate);
      params.append("endDate", formattedEndDate);

      // Use the exact URL format from your curl example
      const url = `${API_URL}/api/v${API_VERSION}/Statistic/expenses/category-spending-by-date-range/${userId}`;

      console.log("Fetching category spending from:", url, "with params:", {
         startDate: formattedStartDate,
         endDate: formattedEndDate,
      });

      const response = await axios.get<CategorySpendingResponse>(url, {
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
         params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
         },
      });

      console.log("Category spending API response:", response.data);

      // Handle the actual format received: {"Food": 500, "Housing": 500}
      if (response.data && typeof response.data === "object" && !response.data.categories) {
         const categories = Object.entries(response.data).map(([name, amount]) => ({
            categoryId: 0, // Since we don't have IDs, use a default
            categoryName: name,
            totalAmount: amount as number,
         }));

         return {
            categories: categories,
            totalSpent: categories.reduce((sum, item) => sum + item.totalAmount, 0),
         };
      }

      // If the API returns an empty object or unexpected structure, transform it
      if (!response.data || Object.keys(response.data).length === 0 || !response.data.categories) {
         // Return valid empty structure
         return {
            categories: [],
            totalSpent: 0,
         };
      }

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch category spending by date range:", {
         error: error.message,
         response: error.response?.data,
      });

      // Return empty result on error
      return {
         categories: [],
         totalSpent: 0,
      };
   }
};

interface MonthlyExpenseItem {
   month: string; // Format: "YYYY-MM" (e.g. "2023-01")
   totalAmount: number;
}

interface MonthlyExpensesResponse {
   expenses: MonthlyExpenseItem[];
   totalSpent: number;
}

/**
 * Fetches monthly expense data within a specified date range
 * @param startDate Start date in 'YYYY-MM-DD' format
 * @param endDate End date in 'YYYY-MM-DD' format
 * @returns Promise with monthly expense data
 */
export const getMonthlyExpensesByDateRange = async (startDate: string, endDate: string): Promise<MonthlyExpensesResponse> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get the user ID from the token
      const userId = await getUserId();

      // Format dates if they're Date objects
      const formattedStartDate = typeof startDate === "object" ? (startDate as Date).toISOString().split("T")[0] : startDate;

      const formattedEndDate = typeof endDate === "object" ? (endDate as Date).toISOString().split("T")[0] : endDate;

      // Use the exact URL format from your curl example
      const url = `${API_URL}/api/v${API_VERSION}/Statistic/expenses/monthly-user-expenses-by-date-range/${userId}`;

      console.log("Fetching monthly expenses from:", url, "with params:", {
         startDate: formattedStartDate,
         endDate: formattedEndDate,
      });

      const response = await axios.get<MonthlyExpensesResponse>(url, {
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
         params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
         },
      });

      console.log("Monthly expenses API response:", response.data);

      // Handle the actual format received: {"2025-05": 1000}
      if (response.data && typeof response.data === "object" && !response.data.expenses) {
         const expenses = Object.entries(response.data).map(([month, amount]) => ({
            month: month, // e.g. "2025-05"
            totalAmount: amount as number,
         }));

         return {
            expenses: expenses,
            totalSpent: expenses.reduce((sum, item) => sum + item.totalAmount, 0),
         };
      }

      // If the API returns an empty object or unexpected structure, transform it
      if (!response.data || Object.keys(response.data).length === 0 || !response.data.expenses) {
         // Return valid empty structure
         return {
            expenses: [],
            totalSpent: 0,
         };
      }

      // If the API returns an unexpected structure, transform it to match our interface
      if (response.data && !response.data.expenses && Array.isArray(response.data)) {
         // Transform from array format to our expected structure
         return {
            expenses: response.data.map((item) => ({
               month: item.month || "Unknown",
               totalAmount: item.totalAmount || 0,
            })),
            totalSpent: response.data.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
         };
      }

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch monthly expenses by date range:", {
         error: error.message,
         response: error.response?.data,
      });

      // Return empty result on error
      return {
         expenses: [],
         totalSpent: 0,
      };
   }
};

interface MonthlyIncomeItem {
   month: string; // Format: "YYYY-MM" (e.g. "2023-01")
   totalAmount: number;
}

interface MonthlyIncomesResponse {
   incomes: MonthlyIncomeItem[];
   totalIncome: number;
}

/**
 * Fetches monthly income data within a specified date range
 * @param startDate Start date in 'YYYY-MM-DD' format or Date object
 * @param endDate End date in 'YYYY-MM-DD' format or Date object
 * @returns Promise with monthly income data
 */
export const getMonthlyIncomesByDateRange = async (startDate: string, endDate: string): Promise<MonthlyIncomesResponse> => {
   try {
      const token = await getStoredToken();
      if (!token) {
         throw new Error("No authentication token found");
      }

      // Get the user ID from the token
      const userId = await getUserId();

      // Format dates if they're Date objects
      const formattedStartDate = typeof startDate === "object" ? (startDate as Date).toISOString().split("T")[0] : startDate;

      const formattedEndDate = typeof endDate === "object" ? (endDate as Date).toISOString().split("T")[0] : endDate;

      // Use the exact URL format from your curl example
      const url = `${API_URL}/api/v${API_VERSION}/Statistic/incomes/monthly-user-incomes-by-date-range/${userId}`;

      console.log("Fetching monthly incomes from:", url, "with params:", {
         startDate: formattedStartDate,
         endDate: formattedEndDate,
      });

      const response = await axios.get<MonthlyIncomesResponse>(url, {
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
         },
         params: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
         },
      });

      console.log("Monthly incomes API response:", response.data);

      // Handle the actual format received: {"2025-05": 1300}
      if (response.data && typeof response.data === "object" && !response.data.incomes) {
         const incomes = Object.entries(response.data).map(([month, amount]) => ({
            month: month, // e.g. "2025-05"
            totalAmount: amount as number,
         }));

         return {
            incomes: incomes,
            totalIncome: incomes.reduce((sum, item) => sum + item.totalAmount, 0),
         };
      }

      // If the API returns an empty object or unexpected structure, transform it
      if (!response.data || Object.keys(response.data).length === 0 || !response.data.incomes) {
         // Return valid empty structure
         return {
            incomes: [],
            totalIncome: 0,
         };
      }

      // If the API returns an unexpected structure, transform it to match our interface
      if (response.data && !response.data.incomes && Array.isArray(response.data)) {
         // Transform from array format to our expected structure
         return {
            incomes: response.data.map((item) => ({
               month: item.month || "Unknown",
               totalAmount: item.totalAmount || 0,
            })),
            totalIncome: response.data.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
         };
      }

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch monthly incomes by date range:", {
         error: error.message,
         response: error.response?.data,
      });

      // Return empty result on error
      return {
         incomes: [],
         totalIncome: 0,
      };
   }
};
