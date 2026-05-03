import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../src/utils/scaling";

export interface ModalButton {
  text: string;
  onPress: () => void;
  type?: "confirm" | "cancel" | "neutral";
  color?: string;
}

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDarkMode: boolean;
  type?: "success" | "error" | "warning" | "info";
  buttons?: ModalButton[];
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  isDarkMode,
  type = "info",
  buttons,
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case "success":
        return { name: "check-circle", color: themeColors.green };
      case "error":
        return { name: "alert-circle", color: themeColors.red };
      case "warning":
        return { name: "alert", color: themeColors.orange || "#FFA500" };
      default:
        return { name: "information", color: themeColors.blue || "#2196F3" };
    }
  };

  const icon = getIcon();

  const renderButtons = () => {
    if (buttons && buttons.length > 0) {
      return (
        <View style={[styles.footer, buttons.length > 2 && styles.footerVertical]}>
          {buttons.map((btn, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.button,
                buttons.length > 2 ? styles.verticalButton : styles.horizontalButton,
                { 
                  backgroundColor: btn.type === "confirm" ? (btn.color || icon.color) : "transparent",
                  borderColor: btn.type === "confirm" ? "transparent" : themeColors.frame_stroke,
                  borderWidth: btn.type === "confirm" ? 0 : 1.5,
                }
              ]}
              onPress={btn.onPress}
            >
              <Text 
                style={[
                  styles.buttonText, 
                  { color: btn.type === "confirm" ? "white" : themeColors.card_description }
                ]}
              >
                {btn.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.footer}>
        {onCancel && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              styles.horizontalButton,
              { borderColor: themeColors.frame_stroke },
            ]}
            onPress={onCancel}
          >
            <Text
              style={[
                styles.buttonText,
                { color: themeColors.card_description },
              ]}
            >
              {cancelText || t("common.cancel")}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            styles.horizontalButton,
            { backgroundColor: icon.color },
            !onCancel && { flex: 1 },
          ]}
          onPress={onConfirm || (() => {})}
        >
          <Text style={[styles.buttonText, { color: "white" }]}>
            {confirmText || t("common.ok")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: themeColors.page_background },
          ]}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={icon.name as any}
              size={moderateScale(60)}
              color={icon.color}
            />
          </View>

          <Text style={[styles.title, { color: themeColors.card_title }]}>
            {title}
          </Text>

          <Text style={[styles.message, { color: themeColors.card_description }]}>
            {message}
          </Text>

          {renderButtons()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: moderateScale(28),
    padding: moderateScale(24),
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconContainer: {
    marginBottom: verticalScale(15),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: verticalScale(10),
  },
  message: {
    fontSize: moderateScale(16),
    textAlign: "center",
    marginBottom: verticalScale(25),
    lineHeight: verticalScale(22),
  },
  footer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  footerVertical: {
    flexDirection: "column",
  },
  button: {
    height: verticalScale(50),
    borderRadius: moderateScale(25),
    justifyContent: "center",
    alignItems: "center",
  },
  horizontalButton: {
    flex: 1,
    marginHorizontal: horizontalScale(6),
  },
  verticalButton: {
    width: "100%",
    marginVertical: verticalScale(5),
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  confirmButton: {
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
});

export default ConfirmationModal;
