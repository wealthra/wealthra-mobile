import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "../context/NotificationContext";
import { getThemeColors } from "../utils/getThemeColors";
import { horizontalScale, verticalScale, moderateScale } from "../utils/scaling";
import { NotificationDto, NotificationType } from "../api/types";
import { useTranslation } from "react-i18next";

interface NotificationCenterScreenProps {
  isDarkMode: boolean;
  navigation: any;
}

const NotificationCenterScreen: React.FC<NotificationCenterScreenProps> = ({
  isDarkMode,
  navigation,
}) => {
  const {
    notifications,
    loading,
    markAsRead,
    clearNotifications,
    fetchNotifications,
  } = useNotifications();
  const theme = getThemeColors(isDarkMode);
  const { t } = useTranslation();

  const getNotificationStyles = (type?: NotificationType) => {
    switch (type) {
      case NotificationType.Alert:
        return { 
          icon: "alert-circle", 
          color: theme.red, 
          bgColor: isDarkMode ? "rgba(239, 100, 100, 0.15)" : "rgba(234, 157, 157, 0.2)" 
        };
      case NotificationType.Warning:
        return { 
          icon: "warning", 
          color: theme.yellow, 
          bgColor: isDarkMode ? "rgba(243, 156, 18, 0.15)" : "rgba(255, 228, 120, 0.2)" 
        };
      case NotificationType.Message:
      case NotificationType.Info:
      default:
        return { 
          icon: type === NotificationType.Message ? "mail" : "information-circle", 
          color: theme.blue, 
          bgColor: isDarkMode ? "rgba(77, 184, 240, 0.15)" : "rgba(133, 193, 233, 0.2)" 
        };
    }
  };

  const beautifyMessage = (message?: string): { tag: string | null; text: string } => {
    if (!message) return { tag: null, text: "" };

    // Mapping for technical tags to user-friendly labels
    const tagMap: Record<string, string> = {
      "[HIGH_INCOME_SHARE]": "High Income Share",
      "[LOW_SAVINGS]": "Low Savings Alert",
      "[UNUSUAL_SPENDING]": "Unusual Activity",
      "[BUDGET_EXCEEDED]": "Budget Limit Reached",
      "[GOAL_ACHIEVED]": "Goal Reached!",
      "[GOAL_PROGRESS]": "Goal Update",
      "[BILL_REMINDER]": "Upcoming Bill",
      "[SUBSCRIPTION_DETECTED]": "New Subscription",
    };

    let processed = message;

    // 1. Clean up potential weird formatting (like %24.4 -> 24.4%)
    processed = processed.replace(/%(\d+\.?\d*)/g, "$1%");

    // 2. Extract and format tags
    let extractedTag = "";
    Object.keys(tagMap).forEach((tag) => {
      if (processed.includes(tag)) {
        extractedTag = tagMap[tag];
        processed = processed.replace(tag, "").trim();
      }
    });

    // 3. Remove any remaining square bracket tags if not in map
    processed = processed.replace(/\[[A-Z_]+\]/g, "").trim();

    // 4. If we found a tag, prepend it beautifully
    if (extractedTag) {
      return { tag: extractedTag, text: processed };
    }

    return { tag: null, text: processed };
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("notifications.now") || "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: NotificationDto }) => {
    const styles_config = getNotificationStyles(item.type);
    const { text } = beautifyMessage(item.message);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { 
            backgroundColor: isDarkMode ? theme.card_background : "#FFFFFF",
            borderLeftColor: styles_config.color,
            borderLeftWidth: 5,
          },
        ]}
        onPress={() => !item.isRead && markAsRead([item.id])}
        activeOpacity={0.8}
      >
        <View style={[styles.innerContent, { backgroundColor: styles_config.bgColor }]}>
          <View style={[styles.iconContainer, { backgroundColor: styles_config.color + "20" }]}>
            <Ionicons name={styles_config.icon as any} size={24} color={styles_config.color} />
          </View>
          <View style={styles.contentContainer}>
            <Text style={[styles.message, { color: theme.card_title }]} numberOfLines={3}>
              {text}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.time}>{formatRelativeTime(item.createdOn)}</Text>
              {!item.isRead && (
                <View style={[styles.unreadBadge, { backgroundColor: styles_config.color }]}>
                  <Text style={styles.unreadText}>{t("notifications.new") || "NEW"}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        onPress={() => markAsRead([], true)}
        style={styles.actionButton}
      >
        <Text style={[styles.actionText, { color: theme.blue }]}>
          {t("notifications.markAllRead") || "Mark all as read"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => clearNotifications([], true)}
        style={styles.actionButton}
      >
        <Text style={[styles.actionText, { color: theme.red }]}>
          {t("notifications.clearAll") || "Clear all"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.page_background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={theme.card_title}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.card_title }]}>
          {t("notifications.title") || "Notifications"}
        </Text>
        <TouchableOpacity
          onPress={() => fetchNotifications()}
          style={styles.refreshButton}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={theme.card_title}
          />
        </TouchableOpacity>
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.blue} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={80}
            color={theme.card_description}
            style={{ opacity: 0.5 }}
          />
          <Text style={[styles.emptyText, { color: theme.card_description }]}>
            {t("notifications.empty") || "No notifications yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(10),
    marginTop: verticalScale(40),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
  },
  backButton: {
    padding: horizontalScale(5),
  },
  refreshButton: {
    padding: horizontalScale(5),
  },
  listContent: {
    paddingHorizontal: horizontalScale(20),
    paddingBottom: verticalScale(40),
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(15),
    marginTop: verticalScale(10),
  },
  actionButton: {
    paddingVertical: verticalScale(5),
  },
  actionText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  notificationItem: {
    borderRadius: horizontalScale(12),
    marginBottom: verticalScale(12),
    overflow: "hidden",
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  innerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: horizontalScale(15),
  },
  iconContainer: {
    width: horizontalScale(48),
    height: horizontalScale(48),
    borderRadius: horizontalScale(24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: horizontalScale(15),
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(4),
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(2),
  },
  time: {
    fontSize: moderateScale(12),
    color: "#888888",
  },
  unreadBadge: {
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  unreadText: {
    color: "white",
    fontSize: moderateScale(10),
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: verticalScale(100),
  },
  emptyText: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(15),
  },
});

export default NotificationCenterScreen;
