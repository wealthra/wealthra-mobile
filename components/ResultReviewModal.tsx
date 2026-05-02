import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ExpenseDto } from "../src/api/types";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../src/utils/scaling";

interface ResultReviewModalProps {
  visible: boolean;
  expenses: ExpenseDto[];
  onConfirm: (expenses: ExpenseDto[]) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const ResultReviewModal: React.FC<ResultReviewModalProps> = ({
  visible,
  expenses: initialExpenses,
  onConfirm,
  onCancel,
  isDarkMode,
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const { t } = useTranslation();
  const [items, setItems] = useState<(ExpenseDto & { tempId: string })[]>([]);

  useEffect(() => {
    setItems(
      initialExpenses.map((exp, index) => ({
        ...exp,
        tempId: `${exp.id}-${index}-${Date.now()}`,
      }))
    );
  }, [initialExpenses]);

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleConfirm = () => {
    onConfirm(items);
  };

  const renderItem = ({ item }: { item: ExpenseDto & { tempId: string } }) => (
    <View style={[styles.itemCard, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f5f5f5" }]}>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemDescription, { color: themeColors.card_title }]}>
          {item.description || t("common.noDescription")}
        </Text>
        <Text style={[styles.itemSubText, { color: themeColors.card_description }]}>
          {item.categoryName || t("common.other")} • {item.paymentMethod || t("common.unknown")}
        </Text>
        <Text style={[styles.itemDate, { color: themeColors.card_description }]}>
          {item.transactionDate ? new Date(item.transactionDate).toLocaleDateString() : ""}
        </Text>
      </View>
      <View style={styles.itemAction}>
        <Text style={[styles.itemAmount, { color: themeColors.red }]}>
          -{item.amount.toFixed(2)}
        </Text>
        <TouchableOpacity onPress={() => removeItem(item.tempId)} style={styles.removeButton}>
          <MaterialCommunityIcons name="delete" size={24} color={themeColors.red} />
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <Text style={[styles.title, { color: themeColors.card_title }]}>
            {t("review.title")}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.card_description }]}>
            {t("review.subtitle")}
          </Text>

          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.tempId}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: themeColors.card_description }]}>
                {t("review.empty")}
              </Text>
            }
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton, { borderColor: themeColors.frame_stroke }]}
              onPress={onCancel}
            >
              <Text style={[styles.footerButtonText, { color: themeColors.card_description }]}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.footerButton, styles.confirmButton, { backgroundColor: themeColors.green }]}
              onPress={handleConfirm}
              disabled={items.length === 0}
            >
              <Text style={[styles.footerButtonText, { color: "white" }]}>
                {t("common.addAll")}
              </Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    elevation: 8,
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: "center",
    marginBottom: verticalScale(20),
    marginTop: verticalScale(5),
  },
  list: {
    marginBottom: verticalScale(20),
  },
  listContent: {
    paddingBottom: verticalScale(10),
  },
  itemCard: {
    flexDirection: "row",
    padding: moderateScale(15),
    borderRadius: moderateScale(15),
    marginBottom: verticalScale(10),
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  itemSubText: {
    fontSize: moderateScale(12),
    marginTop: verticalScale(2),
  },
  itemDate: {
    fontSize: moderateScale(10),
    marginTop: verticalScale(4),
    opacity: 0.8,
  },
  itemAction: {
    alignItems: "flex-end",
  },
  itemAmount: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    marginBottom: verticalScale(5),
  },
  removeButton: {
    padding: moderateScale(5),
  },
  emptyText: {
    textAlign: "center",
    marginTop: verticalScale(40),
    fontSize: moderateScale(16),
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerButton: {
    flex: 1,
    height: verticalScale(50),
    borderRadius: moderateScale(25),
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: horizontalScale(5),
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    elevation: 2,
  },
  footerButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
});

export default ResultReviewModal;
