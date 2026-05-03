import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { NotificationDto } from "../api/types";
import { getNotifications, markNotificationsRead, deleteNotifications as apiDeleteNotifications } from "../api/services/notificationService";
import i18n from "../i18n/config";

interface NotificationContextType {
  notifications: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationIds?: number[], markAll?: boolean) => Promise<void>;
  clearNotifications: (notificationIds?: number[], clearAll?: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (unreadOnly: boolean = false) => {
    setLoading(true);
    try {
      const data = await getNotifications(unreadOnly, i18n.language);
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  const markAsRead = async (notificationIds?: number[], markAll?: boolean) => {
    try {
      await markNotificationsRead(notificationIds, markAll);
      // Refresh notifications locally
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const clearNotifications = async (notificationIds?: number[], clearAll?: boolean) => {
    try {
      await apiDeleteNotifications(notificationIds, clearAll);
      // Refresh notifications locally
      await fetchNotifications();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up an interval to refresh notifications
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [fetchNotifications, i18n.language]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
