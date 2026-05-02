import axiosInstance from "../axiosInstance";
import { getStoredToken } from "./authService";

export interface UserUsageDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: number;
  subscriptionPlanId: number;
  subscriptionPlanName: string;
  ocrRequestsThisMonth: number;
  sttRequestsThisMonth: number;
  monthlyOcrLimit: number;
  monthlySttLimit: number;
  lastUsageActivityDate: string;
}

export const getUserUsage = async (): Promise<UserUsageDto | null> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      console.warn("No authentication token found. Skipping usage fetch.");
      return null;
    }
    const response = await axiosInstance.get<UserUsageDto>("/api/Account/me/usage");
    return response.data;
  } catch (error) {
    console.error("Error fetching user usage limits:", error);
    return null;
  }
};
