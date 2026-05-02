import axiosInstance from "../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
   AuthResponse,
   RegisterUserCommand,
   LoginUserCommand,
   ForgotPasswordCommand,
   VerifyResetCodeCommand,
   ResetPasswordWithCodeCommand
} from "../types";

export const loginUser = async (loginData: LoginUserCommand): Promise<AuthResponse> => {
   try {
      const response = await axiosInstance.post<AuthResponse>('/api/Account/login', loginData);

      const authData: [string, string][] = [
         ["userId", response.data.id],
         ["jwToken", response.data.token],
         ["refreshToken", response.data.refreshToken],
      ].filter(([_, value]) => value !== undefined && value !== null) as [string, string][];

      await AsyncStorage.multiSet(authData);

      return response.data;
   } catch (error: any) {
      console.error("API Request failed:", {
         url: '/api/Account/login',
         error: error.message,
         response: error.response?.data,
      });
      throw error;
   }
};

export const signUp = async (firstName: string, surname: string, email: string, password: string): Promise<any> => {
   try {
      console.log("Sending registration request:", {
         firstName,
         lastName: surname,
         email,
         password: "********",
      });

      const requestData = {
         firstName,
         lastName: surname,
         email,
         password,
         confirmPassword: password,
      };

      const response = await axiosInstance.post<any>('/api/Account/register', requestData, {
         headers: {
            "Content-Type": "application/json",
         },
         validateStatus: function (status) {
            return (status >= 200 && status < 300) || status === 500;
         },
         responseType: "text",
      });

      if (
         response.data &&
         typeof response.data === "string" &&
         (response.data.includes("User Registered") || response.data.includes("confirm-email"))
      ) {
         console.log("Registration successful with email confirmation required");
         return {
            firstName,
            lastName: surname,
            email,
            password: "REDACTED",
            confirmPassword: "REDACTED",
         };
      }

      console.log("Registration successful");

      const responseData =
         typeof response.data === "string"
            ? {
                 firstName,
                 lastName: surname,
                 email,
                 password: "REDACTED",
                 confirmPassword: "REDACTED",
              }
            : response.data;

      return responseData;
   } catch (error: any) {
      if (error.response?.status === 400) {
         console.log("Registration failed with 400 status - likely duplicate email");
         return null;
      }
      if (error.message.includes("Registration failed")) {
         console.log("Registration error:", error.message);
         return null;
      }
      console.error("Registration failed:", error.response?.data);
      console.error("Sign Up error details:", {
         message: error.message,
         status: error.response?.status,
         response: error.response?.data,
      });
      return null;
   }
};

export const forgotPassword = async (email: string): Promise<void> => {
   try {
      const command: ForgotPasswordCommand = { email };
      await axiosInstance.post('/api/Account/forgot-password', command);
      return;
   } catch (error: any) {
      console.error("API Request failed:", {
         url: '/api/Account/forgot-password',
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

export const verifyResetCode = async (email: string, code: string): Promise<void> => {
   try {
      const command: VerifyResetCodeCommand = { email, code };
      await axiosInstance.post('/api/Account/verify-reset-code', command);
      return;
   } catch (error: any) {
      console.error("API Request failed:", {
         url: '/api/Account/verify-reset-code',
         error: error.message,
         response: error.response?.data,
      });
      throw error;
   }
};

export const resetPassword = async (command: ResetPasswordWithCodeCommand): Promise<void> => {
   try {
      await axiosInstance.post('/api/Account/reset-password', command);
      return;
   } catch (error: any) {
      console.error("API Request failed:", {
         url: '/api/Account/reset-password',
         error: error.message,
         response: error.response?.data,
      });
      throw error;
   }
};

export const getStoredToken = async (): Promise<string | null> => {
   return await AsyncStorage.getItem("jwToken");
};

export const getStoredRefreshToken = async (): Promise<string | null> => {
   return await AsyncStorage.getItem("refreshToken");
};

export const getStoredUserId = async (): Promise<string | null> => {
   return await AsyncStorage.getItem("userId");
};

export const clearAuthData = async (): Promise<void> => {
   await AsyncStorage.multiRemove(["userId", "jwToken", "refreshToken", "userRoles"]);
};

export const getUserId = async (): Promise<string> => {
   try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) return userId;

      throw new Error("No user ID found in storage");
   } catch (error) {
      console.error("Failed to get user ID from storage:", error);
      throw new Error("Could not retrieve user ID");
   }
};
export const getStoredCurrency = async (): Promise<string> => {
   try {
      const currency = await AsyncStorage.getItem("preferredCurrency");
      return currency || "USD";
   } catch (error) {
      console.error("Failed to get stored currency:", error);
      return "USD";
   }
};
