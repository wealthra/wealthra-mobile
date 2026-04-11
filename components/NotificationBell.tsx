import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useNotifications } from "../src/context/NotificationContext";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";
import { getThemeColors } from "../src/utils/getThemeColors";

interface NotificationBellProps {
  isDarkMode: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ isDarkMode }) => {
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotifications();
  const theme = getThemeColors(isDarkMode);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("NotificationCenter")}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Ionicons
        name="notifications-outline"
        size={moderateScale(28)}
        color={isDarkMode ? "#FFFFFF" : "#333333"}
      />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.red }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: horizontalScale(5),
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: horizontalScale(0),
    top: verticalScale(0),
    minWidth: horizontalScale(18),
    height: horizontalScale(18),
    borderRadius: horizontalScale(9),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent", // Will be set dynamically if needed, or keep clean
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10),
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default NotificationBell;
