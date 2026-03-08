import axiosInstance from "../axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStoredToken, getUserId, clearAuthData } from "./authService";
import { UserDto, RefreshTokenRequest, RefreshTokenResponse, UpdateUserCommand } from "../types";

export const updateUserProfile = async (profileData: UpdateUserCommand): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      console.log("Updating user profile with data:", profileData);

      const response = await axiosInstance.put('/api/Account/update-user', profileData, {
         headers: {
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

      if (error.response?.status === 409) {
         throw new Error(error.response.data.message || "Email is already in use");
      }

      const errorMessage = error.response?.data?.Message || error.response?.data?.message || "Failed to update profile";
      throw new Error(errorMessage);
   }
};

export const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const userId = await getUserId();
      const requestData = {
         userId: userId,
         currentPassword: currentPassword,
         newPassword: newPassword,
         confirmPassword: confirmPassword,
      };

      console.log("Changing password for user:", userId);

      const response = await axiosInstance.put('/api/Account/update-password', requestData, {
         headers: {
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

export const getUserInfo = async (): Promise<UserDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const userId = await getUserId();

      const response = await axiosInstance.get<UserDto>('/api/Account/user-info', {
         headers: {
            "Content-Type": "application/json",
         },
         params: {
            UserId: userId,
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

export const getCurrentUser = async (): Promise<UserDto> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const response = await axiosInstance.get<UserDto>('/api/Account/me', {
         headers: {
            "Content-Type": "application/json",
         },
      });

      console.log("Current user fetched successfully via /api/Account/me");
      return response.data;
   } catch (error: any) {
      console.error("Failed to get current user:", {
         error: error.message,
         status: error.response?.status,
         data: error.response?.data,
      });

      const errorMessage = error.response?.data?.message || "Failed to get current user";
      throw new Error(errorMessage);
   }
};

export const refreshToken = async (): Promise<RefreshTokenResponse> => {
   try {
      const currentToken = await getStoredToken();
      if (!currentToken) throw new Error("No authentication token found");

      const requestData: RefreshTokenRequest = {
         token: currentToken
      };

      const response = await axiosInstance.post<RefreshTokenResponse>('/api/Account/refresh-token', requestData, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      // Update AsyncStorage seamlessly
      if (response.data && response.data.token) {
         await AsyncStorage.multiSet([
            ["userId", response.data.id],
            ["jwToken", response.data.token],
         ]);
         console.log("Token successfully refreshed");
      }

      return response.data;
   } catch (error: any) {
      console.error("Failed to refresh token:", {
         error: error.message,
         status: error.response?.status,
         data: error.response?.data,
      });

      const errorMessage = error.response?.data?.message || "Failed to refresh token";
      throw new Error(errorMessage);
   }
};

export const revokeToken = async (): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      await axiosInstance.post('/api/Account/revoke-token', {}, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      // Erase tokens locally
      await clearAuthData();
      console.log("Session token revoked and cleared successfully");
   } catch (error: any) {
      console.error("Failed to revoke token:", {
         error: error.message,
         status: error.response?.status,
         data: error.response?.data,
      });

      const errorMessage = error.response?.data?.message || "Failed to revoke token";
      throw new Error(errorMessage);
   }
};

export const deleteAccount = async (): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      await axiosInstance.delete('/api/Account/me', {
         headers: {
            "Content-Type": "application/json",
         },
      });

      // Erase tokens locally as account no longer exists
      await clearAuthData();
      console.log("Account deleted successfully");
   } catch (error: any) {
      console.error("Failed to delete account:", {
         error: error.message,
         status: error.response?.status,
         data: error.response?.data,
      });

      const errorMessage = error.response?.data?.message || "Failed to delete account";
      throw new Error(errorMessage);
   }
};
