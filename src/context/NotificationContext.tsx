import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { NotificationDto } from "../api/types";
import { getNotifications, markNotificationsRead, deleteNotifications as apiDeleteNotifications } from "../api/services/notificationService";
import { createNotificationConnection, startSignalRConnection } from "../api/services/signalRService";
import * as signalR from "@microsoft/signalr";
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
  const connectionRef = useRef<signalR.HubConnection | null>(null);

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
    
    const setupSignalR = async () => {
      // Clean up existing connection if it exists
      if (connectionRef.current) {
        await connectionRef.current.stop();
        connectionRef.current = null;
      }

      const connection = await createNotificationConnection();
      if (connection) {
        connectionRef.current = connection;

        connection.on("ReceiveNotification", (notification: NotificationDto) => {
          console.log("🔔 New Notification Received via SignalR:", notification);
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        });

        await startSignalRConnection(connection);
      }
    };

    setupSignalR();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
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
