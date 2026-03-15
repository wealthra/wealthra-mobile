import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";
import { Picker } from "@react-native-picker/picker";

interface AddBudgetModalProps {
   visible: boolean;
   onClose: () => void;
   onAdd: (budget: { category: string; budgetLimit: number; currentAmount: number }) => void;
   isDarkMode: boolean;
   categories: string[];
}

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ visible, onClose, onAdd, isDarkMode, categories }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t, i18n } = useTranslation();

   const [budgetLimit, setBudgetLimit] = useState("");
   const [currentAmount, setCurrentAmount] = useState("");
   const [selectedCategory, setSelectedCategory] = useState("");

   // Update component state when language changes
   useEffect(() => {
      // This will force a re-render when language changes
      console.log("Language changed to:", i18n.language);
   }, [i18n.language]);

   const handleSubmit = () => {
      const limitAmount = parseFloat(budgetLimit);
      let parsedCurrentAmount = 0;
      if (currentAmount !== "") {
         parsedCurrentAmount = parseFloat(currentAmount);
         if (isNaN(parsedCurrentAmount)) parsedCurrentAmount = 0;
      }

      if (parsedCurrentAmount > limitAmount) {
         return;
      }

      if (selectedCategory && !isNaN(limitAmount) && limitAmount > 0) {
         onAdd({
            category: selectedCategory,
            budgetLimit: limitAmount,
            currentAmount: parsedCurrentAmount,
         });

         setBudgetLimit("");
         setCurrentAmount("");
         setSelectedCategory("");
         onClose();
      }
   };

   const resetAndClose = () => {
      setBudgetLimit("");
      setCurrentAmount("");
      setSelectedCategory("");
      onClose();
   };

   // Get translated category names based on the original English names
   const getTranslatedCategoryName = (categoryName: string) => {
      // Use the original name as the translation key
      const translationKey = `categories.${categoryName.toLowerCase().replace(/\s+/g, "_")}`;
      const translated = t(translationKey);

      // If no translation found (returns the key), use the original name
      return translated === translationKey ? categoryName : translated;
   };

   return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={resetAndClose} statusBarTranslucent={true}>
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={resetAndClose}>
            <TouchableOpacity
               activeOpacity={1}
               onPress={(e) => e.stopPropagation()}
               style={[styles.modalContent, { backgroundColor: themeColors.page_background }]}>
               <Text style={[styles.modalTitle, { color: themeColors.card_title }]}>{t("addBudgetModalTitle")}</Text>

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

               <TextInput
                  style={[
                     styles.input,
                     {
                        backgroundColor: themeColors.page_background,
                        color: themeColors.card_title,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  placeholder={t("budget.enterCurrentAmount")}
                  placeholderTextColor={themeColors.card_description}
                  keyboardType="numeric"
                  value={currentAmount}
                  onChangeText={setCurrentAmount}
               />

               <View style={[styles.pickerContainer, { borderColor: themeColors.frame_stroke }]}>
                  <Picker
                     selectedValue={selectedCategory}
                     onValueChange={(itemValue) => setSelectedCategory(itemValue.toString())}
                     style={[
                        styles.picker,
                        {
                           color: themeColors.card_title,
                           fontSize: 14,
                        },
                     ]}
                     dropdownIconColor={themeColors.card_title}>
                     <Picker.Item
                        label={t("budgetCategories")}
                        value=""
                        enabled={false}
                        color={themeColors.card_description}
                        style={{ fontSize: 14 }}
                     />
                     {categories.map((category) => (
                        <Picker.Item key={category} label={getTranslatedCategoryName(category)} value={category} style={{ fontSize: 14 }} />
                     ))}
                  </Picker>
               </View>

               <TouchableOpacity
                  style={[
                     styles.addButton,
                     {
                        backgroundColor: themeColors.green || "#4CAF50",
                     },
                  ]}
                  onPress={handleSubmit}>
                  <Text style={styles.addButtonText}>{t("budget.addButton")}</Text>
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
   pickerContainer: {
      borderWidth: 1,
      borderRadius: moderateScale(25),
      marginBottom: verticalScale(20),
      overflow: "hidden",
   },
   picker: {
      height: verticalScale(55),
      width: "100%",
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

export default AddBudgetModal;
