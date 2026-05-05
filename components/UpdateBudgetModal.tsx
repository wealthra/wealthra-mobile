import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal } from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";

interface UpdateBudgetModalProps {
   visible: boolean;
   onClose: () => void;
   onUpdate: (id: number, budgetLimit: number) => void;
   isDarkMode: boolean;
   initialBudget: {
      id: number;
      categoryName: string;
      budgetLimit: number;
   } | null;
}

const UpdateBudgetModal: React.FC<UpdateBudgetModalProps> = ({ visible, onClose, onUpdate, isDarkMode, initialBudget }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t } = useTranslation();

   const [budgetLimit, setBudgetLimit] = useState("");

   useEffect(() => {
      if (initialBudget) {
         setBudgetLimit(initialBudget.budgetLimit.toString());
      }
   }, [initialBudget, visible]);

   const handleSubmit = () => {
      const limitAmount = parseFloat(budgetLimit);

      if (initialBudget && !isNaN(limitAmount) && limitAmount > 0) {
         onUpdate(initialBudget.id, limitAmount);
         onClose();
      }
   };

   const getTranslatedCategoryName = (categoryName: string) => {
      if (!categoryName) return "";
      const translationKey = `categories.${categoryName.toLowerCase().replace(/\s+/g, "_")}`;
      const translated = t(translationKey);
      return translated === translationKey ? categoryName : translated;
   };

   return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose} statusBarTranslucent={true}>
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <TouchableOpacity
               activeOpacity={1}
               onPress={(e) => e.stopPropagation()}
               style={[styles.modalContent, { backgroundColor: themeColors.page_background }]}>
               <Text style={[styles.modalTitle, { color: themeColors.card_title }]}>{t("updateBudgetModalTitle")}</Text>

               {initialBudget && (
                  <Text style={[styles.categoryInfo, { color: themeColors.card_description }]}>
                     {t("common.category") || "Category"}: {getTranslatedCategoryName(initialBudget.categoryName)}
                  </Text>
               )}

               <TextInput
                  style={[
                     styles.input,
                     {
                        backgroundColor: themeColors.page_background,
                        color: themeColors.card_title,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  placeholder={t("budget.enterBudgetAmount")}
                  placeholderTextColor={themeColors.card_description}
                  keyboardType="numeric"
                  value={budgetLimit}
                  onChangeText={setBudgetLimit}
               />

               <TouchableOpacity
                  style={[
                     styles.addButton,
                     {
                        backgroundColor: themeColors.green || "#4CAF50",
                     },
                  ]}
                  onPress={handleSubmit}>
                  <Text style={styles.addButtonText}>{t("updateBudgetButtonText")}</Text>
               </TouchableOpacity>
            </TouchableOpacity>
         </TouchableOpacity>
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
      padding: moderateScale(20),
      borderRadius: moderateScale(24),
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: verticalScale(2) },
      shadowOpacity: 0.25,
      shadowRadius: moderateScale(4),
   },
   modalTitle: {
      fontSize: moderateScale(24),
      fontWeight: "600",
      marginBottom: verticalScale(10),
      textAlign: "center",
   },
   categoryInfo: {
      fontSize: moderateScale(16),
      marginBottom: verticalScale(20),
      textAlign: "center",
   },
   input: {
      height: verticalScale(50),
      borderWidth: 1,
      borderRadius: moderateScale(25),
      paddingHorizontal: horizontalScale(20),
      marginBottom: verticalScale(16),
      fontSize: moderateScale(16),
   },
   addButton: {
      height: verticalScale(50),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: moderateScale(25),
   },
   addButtonText: {
      color: "white",
      fontSize: moderateScale(18),
      fontWeight: "600",
   },
});

export default UpdateBudgetModal;
