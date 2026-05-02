import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../src/utils/scaling";
import {
  AnnouncementDto,
  AnnouncementSeverity,
} from "../src/api/types/announcement.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface AnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  announcement: AnnouncementDto | null;
  isDarkMode: boolean;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  visible,
  onClose,
  announcement,
  isDarkMode,
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const { i18n, t } = useTranslation();

  if (!announcement) return null;

  const isTr = i18n.language === "tr";
  const title = isTr ? announcement.titleTr : announcement.titleEn;
  const body = isTr ? announcement.bodyTr : announcement.bodyEn;

  const getSeverityConfig = (severity: AnnouncementSeverity) => {
    switch (severity) {
      case AnnouncementSeverity.Success:
        return {
          icon: "check-circle",
          colors: ["#00b894", "#00cec9"],
          label: t("common.success") || "Success",
        };
      case AnnouncementSeverity.Warning:
        return {
          icon: "alert",
          colors: ["#fdcb6e", "#e17055"],
          label: t("common.warning") || "Warning",
        };
      case AnnouncementSeverity.Error:
        return {
          icon: "alert-octagon",
          colors: ["#d63031", "#e84393"],
          label: t("common.error") || "Error",
        };
      case AnnouncementSeverity.Promotion:
        return {
          icon: "star",
          colors: ["#6c5ce7", "#a29bfe"],
          label: t("common.promotion") || "Promotion",
        };
      case AnnouncementSeverity.Info:
      default:
        return {
          icon: "information",
          colors: ["#0984e3", "#74b9ff"],
          label: t("common.info") || "Info",
        };
    }
  };

  const config = getSeverityConfig(announcement.severity);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: themeColors.page_background },
          ]}
        >
          <LinearGradient
            colors={config.colors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <MaterialCommunityIcons name={config.icon as any} size={moderateScale(40)} color="white" />
              <Text style={styles.severityLabel}>{config.label}</Text>
            </View>
          </LinearGradient>

          <View style={styles.bodyContainer}>
            <Text style={[styles.title, { color: themeColors.card_title }]}>
              {title}
            </Text>
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              <Text style={[styles.body, { color: themeColors.card_description }]}>
                {body}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: themeColors.green }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>{t("common.gotIt") || "Got it!"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: moderateScale(24),
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(5) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(10),
  },
  headerGradient: {
    paddingVertical: verticalScale(30),
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  severityLabel: {
    color: "white",
    fontSize: moderateScale(14),
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: verticalScale(8),
    letterSpacing: 1,
  },
  bodyContainer: {
    padding: moderateScale(24),
    alignItems: "center",
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: verticalScale(16),
  },
  scrollArea: {
    maxHeight: verticalScale(200),
    width: "100%",
    marginBottom: verticalScale(24),
  },
  body: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    textAlign: "center",
  },
  closeButton: {
    width: "100%",
    height: verticalScale(55),
    borderRadius: moderateScale(28),
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(4),
  },
  closeButtonText: {
    color: "white",
    fontSize: moderateScale(18),
    fontWeight: "600",
  },
});

export default AnnouncementModal;
