import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
} from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ExpenseDto } from "../src/api/types";
import { Picker } from "@react-native-picker/picker";
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
  categories: { id: number; name: string }[];
}

const ResultReviewModal: React.FC<ResultReviewModalProps> = ({
  visible,
  expenses: initialExpenses,
  onConfirm,
  onCancel,
  isDarkMode,
  categories,
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const { t } = useTranslation();
  const [items, setItems] = useState<(ExpenseDto & { tempId: string })[]>([]);
  const [editingItem, setEditingItem] = useState<(ExpenseDto & { tempId: string }) | null>(null);

  // Form states for editing
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategoryId, setEditCategoryId] = useState(0);

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

  const startEditing = (item: ExpenseDto & { tempId: string }) => {
    setEditingItem(item);
    setEditDescription(item.description || "");
    setEditAmount(item.amount.toString());
    
    // Try to find category ID by name if ID is missing
    let categoryId = item.categoryId;
    if (!categoryId && item.categoryName && categories.length > 0) {
      const found = categories.find(c => 
        c.name?.toLowerCase() === item.categoryName?.toLowerCase()
      );
      if (found) categoryId = found.id;
    }
    
    setEditCategoryId(categoryId || (categories.length > 0 ? categories[0].id : 0));
  };

  const saveEdit = () => {
    if (!editingItem) return;

    const category = categories.find(c => c.id === editCategoryId);

    setItems((prev) =>
      prev.map((item) =>
        item.tempId === editingItem.tempId
          ? {
              ...item,
              description: editDescription,
              amount: parseFloat(editAmount) || 0,
              categoryId: editCategoryId,
              categoryName: category ? category.name : item.categoryName,
            }
          : item
      )
    );
    setEditingItem(null);
  };

  const handleConfirm = () => {
    onConfirm(items);
  };

  const getTranslatedCategoryName = (categoryName: string) => {
    if (!categoryName) return t("categories.miscellaneous");
    const translationKey = `categories.${categoryName.toLowerCase().replace(/\s+/g, "_")}`;
    const translated = t(translationKey);
    return translated === translationKey ? categoryName : translated;
  };

  const renderItem = ({ item }: { item: ExpenseDto & { tempId: string } }) => (
    <View style={[styles.itemCard, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f5f5f5" }]}>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemDescription, { color: themeColors.card_title }]}>
          {item.description || t("common.noDescription")}
        </Text>
        <Text style={[styles.itemSubText, { color: themeColors.card_description }]}>
          {getTranslatedCategoryName(item.categoryName || "")} • {item.paymentMethod || t("common.unknown")}
        </Text>
        <Text style={[styles.itemDate, { color: themeColors.card_description }]}>
          {item.transactionDate ? new Date(item.transactionDate).toLocaleDateString() : ""}
        </Text>
      </View>
      <View style={styles.itemAction}>
        <Text style={[styles.itemAmount, { color: themeColors.red }]}>
          -{item.amount.toFixed(2)}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => startEditing(item)} style={styles.actionButton}>
            <MaterialCommunityIcons name="pencil" size={20} color={themeColors.green} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeItem(item.tempId)} style={styles.actionButton}>
            <MaterialCommunityIcons name="delete" size={20} color={themeColors.red} />
          </TouchableOpacity>
        </View>
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
          {editingItem ? (
            <View style={styles.editForm}>
              <Text style={[styles.title, { color: themeColors.card_title, marginBottom: 20 }]}>
                {t("review.editTitle") || "Edit Expense"}
              </Text>
              
              <TextInput
                style={[styles.input, { color: themeColors.card_title, borderColor: themeColors.frame_stroke }]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder={t("expense.descriptionPlaceholder")}
                placeholderTextColor={themeColors.card_description}
              />

              <TextInput
                style={[styles.input, { color: themeColors.card_title, borderColor: themeColors.frame_stroke }]}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                placeholder={t("expense.amountPlaceholder")}
                placeholderTextColor={themeColors.card_description}
              />

              <View style={[styles.pickerContainer, { borderColor: themeColors.frame_stroke }]}>
                <Picker
                  selectedValue={editCategoryId}
                  onValueChange={(itemValue) => setEditCategoryId(itemValue)}
                  style={{ color: themeColors.card_title }}
                  dropdownIconColor={themeColors.card_title}
                >
                  {categories.map((category) => (
                    <Picker.Item
                      key={category.id}
                      label={getTranslatedCategoryName(category.name)}
                      value={category.id}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.editFooter}>
                <TouchableOpacity
                  style={[styles.editButton, { borderColor: themeColors.frame_stroke }]}
                  onPress={() => setEditingItem(null)}
                >
                  <Text style={{ color: themeColors.card_description }}>{t("common.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton, { backgroundColor: themeColors.green }]}
                  onPress={saveEdit}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>{t("common.save")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
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
            </>
          )}
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
    padding: moderateScale(12),
    borderRadius: moderateScale(15),
    marginBottom: verticalScale(10),
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: moderateScale(15),
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
    justifyContent: "center",
  },
  itemAmount: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    marginBottom: verticalScale(5),
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: moderateScale(5),
    marginLeft: horizontalScale(5),
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
  editForm: {
    width: "100%",
  },
  input: {
    height: verticalScale(50),
    borderWidth: 1,
    borderRadius: moderateScale(25),
    paddingHorizontal: horizontalScale(20),
    marginBottom: verticalScale(15),
    fontSize: moderateScale(16),
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: moderateScale(25),
    marginBottom: verticalScale(20),
    overflow: "hidden",
  },
  editFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    flex: 1,
    height: verticalScale(50),
    borderRadius: moderateScale(25),
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: horizontalScale(5),
    borderWidth: 1,
  },
  saveButton: {
    borderWidth: 0,
  },
});

export default ResultReviewModal;

