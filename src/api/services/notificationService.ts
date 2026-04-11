import axiosInstance from "../axiosInstance";
import { getStoredToken } from "./authService";
import { NotificationDto, ClearAllNotificationsCommand, MarkNotificationsReadCommand } from "../types";

export const getNotifications = async (unreadOnly: boolean = false): Promise<NotificationDto[]> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const response = await axiosInstance.get<NotificationDto[]>(`/api/Notifications`, {
         headers: {
            "Content-Type": "application/json",
         },
         params: { unreadOnly }
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch notifications");
   }
};

export const markNotificationsRead = async (notificationIds?: number[], markAll?: boolean): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const requestData: MarkNotificationsReadCommand = {
         notificationIds,
         markAll
      };

      await axiosInstance.post(`/api/Notifications/mark-read`, requestData, {
         headers: {
            "Content-Type": "application/json",
         },
      });
   } catch (error: any) {
      console.error("Failed to mark notifications read:", error);
      throw new Error(error.response?.data?.message || "Failed to mark notifications read");
   }
};

export const deleteNotifications = async (notificationIds?: number[], clearAll?: boolean): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const requestData: ClearAllNotificationsCommand = {
         notificationIds,
         clearAll
      };

      await axiosInstance.delete(`/api/Notifications`, {
         headers: {
            "Content-Type": "application/json",
         },
         data: requestData
      } as any);
   } catch (error: any) {
      console.error("Failed to delete notifications:", error);
      throw new Error(error.response?.data?.message || "Failed to delete notifications");
   }
};
