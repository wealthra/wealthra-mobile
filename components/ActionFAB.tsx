import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
  TouchableWithoutFeedback,
  Easing,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getThemeColors } from "../src/utils/getThemeColors";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../src/utils/scaling";
import { useTranslation } from "react-i18next";

export interface FABAction {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  color?: string;
}

interface ActionFABProps {
  isDarkMode: boolean;
  actions: FABAction[];
}

const ActionFAB: React.FC<ActionFABProps> = ({ isDarkMode, actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const themeColors = getThemeColors(isDarkMode);
  const { t } = useTranslation();

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    setIsOpen(!isOpen);
  };

  const handleAction = (action: () => void) => {
    toggleMenu();
    setTimeout(action, 300); // Small delay to let menu close
  };

  const getSubButtonStyle = (index: number) => {
    return {
      transform: [
        { scale: animation },
        {
          translateY: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -verticalScale(60) * (index + 1)],
          }),
        },
      ],
      opacity: animation,
    };
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <View style={styles.container}>
      {/* Overlay to close when clicking outside */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Sub Buttons */}
      {actions.map((action, index) => (
        <Animated.View
          key={index}
          style={[styles.subButtonContainer, getSubButtonStyle(index)]}
        >
          <Text
            style={[
              styles.label,
              {
                color: themeColors.card_title,
                backgroundColor: isDarkMode
                  ? "rgba(30, 30, 30, 0.9)"
                  : "rgba(255, 255, 255, 0.9)",
              },
            ]}
          >
            {action.label}
          </Text>
          <TouchableOpacity
            style={[
              styles.subButton,
              {
                backgroundColor: themeColors.card_background,
                borderColor: themeColors.frame_stroke,
              },
            ]}
            onPress={() => handleAction(action.onPress)}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={24}
              color={action.color || themeColors.green}
            />
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* Main FAB */}
      <TouchableOpacity
        style={[styles.mainButton, { backgroundColor: themeColors.green }]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <MaterialCommunityIcons name="plus" size={30} color="white" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: verticalScale(30),
    right: horizontalScale(20),
    alignItems: "center",
    zIndex: 1000,
  },
  overlay: {
    position: "absolute",
    bottom: -verticalScale(30),
    right: -horizontalScale(20),
    width: 2000, // Large enough to cover screen
    height: 2000,
  },
  mainButton: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  subButtonContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: horizontalScale(200),
    right: 0,
  },
  subButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginLeft: horizontalScale(10),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(4),
    overflow: "hidden",
  },
});

export default ActionFAB;
