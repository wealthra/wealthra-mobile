import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { getThemeColors } from "../src/utils/getThemeColors";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../src/utils/scaling";
import { exportData, ExportParams } from "../src/api/services/exportService";

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

interface SelectionOption {
  label: string;
  value: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose, isDarkMode }) => {
  const { t, i18n } = useTranslation();
  const theme = getThemeColors(isDarkMode);
  
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [currency, setCurrency] = useState<'USD' | 'TRY' | 'EUR'>('USD');
  const [lang, setLang] = useState<'en' | 'tr'>(i18n.language as 'en' | 'tr');
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Selector state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTitle, setPickerTitle] = useState("");
  const [pickerOptions, setPickerOptions] = useState<SelectionOption[]>([]);
  const [currentPickerKey, setCurrentPickerKey] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params: ExportParams = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        format,
        currency,
        lang,
      };
      await exportData(params);
      Alert.alert(t("alert.genericSuccessTitle"), t("export.success"));
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert(t("alert.genericErrorTitle"), t("export.error"));
    } finally {
      setIsExporting(false);
    }
  };

  const openPicker = (key: string, title: string, options: SelectionOption[]) => {
    setCurrentPickerKey(key);
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerVisible(true);
  };

  const onSelectOption = (value: string) => {
    if (currentPickerKey === "format") setFormat(value as any);
    if (currentPickerKey === "currency") setCurrency(value as any);
    if (currentPickerKey === "lang") setLang(value as any);
    setPickerVisible(false);
  };

  const renderDropdown = (label: string, value: string, onPress: () => void, icon: string = "chevron-down") => (
    <View style={styles.dropdownContainer}>
      <Text style={[styles.label, { color: theme.card_description }]}>{label}</Text>
      <TouchableOpacity 
        style={[styles.dropdown, { backgroundColor: theme.page_background, borderColor: theme.frame_stroke }]} 
        onPress={onPress}
      >
        <Text style={[styles.dropdownText, { color: theme.card_title }]}>{value}</Text>
        <Ionicons name={icon as any} size={20} color={theme.card_description} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: theme.card_background, borderColor: theme.frame_stroke }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.card_title }]}>{t("export.title")}</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={24} color={theme.card_description} />
              </TouchableOpacity>
            </View>

            <View style={styles.grid}>
              <View style={styles.col}>
                <Text style={[styles.label, { color: theme.card_description }]}>{t("export.startDate")}</Text>
                <TouchableOpacity 
                  style={[styles.dropdown, { backgroundColor: theme.page_background, borderColor: theme.frame_stroke }]} 
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={[styles.dropdownText, { color: theme.card_title }]}>{startDate.toISOString().split('T')[0]}</Text>
                  <Ionicons name="calendar-outline" size={20} color={theme.card_description} />
                </TouchableOpacity>
              </View>
              <View style={styles.col}>
                <Text style={[styles.label, { color: theme.card_description }]}>{t("export.endDate")}</Text>
                <TouchableOpacity 
                  style={[styles.dropdown, { backgroundColor: theme.page_background, borderColor: theme.frame_stroke }]} 
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={[styles.dropdownText, { color: theme.card_title }]}>{endDate.toISOString().split('T')[0]}</Text>
                  <Ionicons name="calendar-outline" size={20} color={theme.card_description} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.col}>
                {renderDropdown(t("export.format"), format.toUpperCase(), () => 
                  openPicker("format", t("export.format"), [
                    { label: "PDF", value: "pdf" },
                    { label: "Excel", value: "excel" }
                  ])
                )}
              </View>
              <View style={styles.col}>
                {renderDropdown(t("export.currency"), currency, () => 
                  openPicker("currency", t("export.currency"), [
                    { label: "USD", value: "USD" },
                    { label: "TRY", value: "TRY" },
                    { label: "EUR", value: "EUR" }
                  ])
                )}
              </View>
            </View>

            <View style={styles.fullWidth}>
              {renderDropdown(t("export.language"), lang === 'en' ? 'English' : 'Turkish', () => 
                openPicker("lang", t("export.language"), [
                  { label: "English", value: "en" },
                  { label: "Turkish", value: "tr" }
                ])
              )}
            </View>

            <View style={[styles.footer, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F9F9F9" }]}>
              <TouchableOpacity 
                style={[styles.btn, styles.btnCancel, { borderColor: theme.frame_stroke }]} 
                onPress={onClose}
              >
                <Text style={[styles.btnText, { color: theme.card_title }]}>{t("export.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, styles.btnDownload, { backgroundColor: theme.green }]} 
                onPress={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={[styles.btnText, { color: "white" }]}>{t("export.download")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
      </Modal>

      {/* Options Selection Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={[styles.pickerCard, { backgroundColor: theme.card_background }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: theme.card_title }]}>{pickerTitle}</Text>
            </View>
            <ScrollView bounces={false}>
              {pickerOptions.map((option) => (
                <TouchableOpacity 
                  key={option.value} 
                  style={[styles.optionItem, { borderBottomColor: theme.frame_stroke }]}
                  onPress={() => onSelectOption(option.value)}
                >
                  <Text style={[styles.optionText, { color: theme.card_title }]}>{option.label}</Text>
                  {(currentPickerKey === "format" && format === option.value) ||
                   (currentPickerKey === "currency" && currency === option.value) ||
                   (currentPickerKey === "lang" && lang === option.value) ? (
                    <Ionicons name="checkmark" size={22} color={theme.green} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: horizontalScale(20),
  },
  card: {
    width: "100%",
    borderRadius: moderateScale(16),
    overflow: "hidden",
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
  },
  grid: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(20),
    paddingTop: verticalScale(15),
    gap: horizontalScale(15),
  },
  col: {
    flex: 1,
  },
  fullWidth: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(15),
  },
  dropdownContainer: {
    width: "100%",
  },
  label: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(8),
    fontWeight: "600",
  },
  dropdown: {
    height: verticalScale(45),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(15),
  },
  dropdownText: {
    fontSize: moderateScale(14),
  },
  footer: {
    flexDirection: "row",
    padding: moderateScale(20),
    gap: horizontalScale(15),
    marginTop: verticalScale(10),
  },
  btn: {
    flex: 1,
    height: verticalScale(45),
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  btnCancel: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  btnDownload: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  btnText: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
  },
  // Picker Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerCard: {
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingBottom: verticalScale(40),
    maxHeight: "50%",
  },
  pickerHeader: {
    alignItems: "center",
    paddingVertical: verticalScale(20),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  pickerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(18),
    paddingHorizontal: horizontalScale(24),
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: moderateScale(16),
  },
});

export default ExportModal;
