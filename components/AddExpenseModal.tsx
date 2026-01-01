import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { Picker } from "@react-native-picker/picker";

interface AddExpenseModalProps {
   visible: boolean;
   onClose: () => void;
   onAdd: (expense: { description: string; amount: number; method: string; isRecurring: boolean; categoryId: number }) => void;
   isDarkMode: boolean;
   categories: { id: number; name: string }[]; // Update to match API structure - just simple string
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ visible, onClose, onAdd, isDarkMode, categories }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t, i18n } = useTranslation();
   const [description, setDescription] = useState("");
   const [amount, setAmount] = useState("");
   const [method, setMethod] = useState("");
   const [isRecurring, setIsRecurring] = useState(true);
   const [categoryId, setCategoryId] = useState(categories[0]?.id || 0);

   // Update component state when language changes
   useEffect(() => {
      // This will force a re-render when language changes
      console.log("Language changed to:", i18n.language);
   }, [i18n.language]);

   const handleAdd = () => {
      if (description && amount && method && categoryId > 0) {
         onAdd({
            description,
            amount: Number(amount),
            method,
            isRecurring,
            categoryId,
         });
         resetForm();
         onClose();
      }
   };

   const resetForm = () => {
      setDescription("");
      setAmount("");
      setMethod("");
      setIsRecurring(true);
      setCategoryId(categories[0]?.id || 0);
   };

   const handleClose = () => {
      resetForm();
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
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose} statusBarTranslucent={true}>
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
            <TouchableOpacity
               activeOpacity={1}
               onPress={(e) => e.stopPropagation()}
               style={[styles.modalContent, { backgroundColor: themeColors.page_background }]}>
               <Text style={[styles.modalTitle, { color: themeColors.card_title }]}>{t("addExpenseModalTitle")}</Text>

               <TextInput
                  style={[
                     styles.input,
                     { backgroundColor: themeColors.page_background, color: themeColors.card_title, borderColor: themeColors.frame_stroke },
                  ]}
                  placeholder={t("expense.enterDescription")}
                  placeholderTextColor={themeColors.card_title}
                  value={description}
                  onChangeText={setDescription}
               />

               <TextInput
                  style={[
                     styles.input,
                     { backgroundColor: themeColors.page_background, color: themeColors.card_title, borderColor: themeColors.frame_stroke },
                  ]}
                  placeholder={t("expense.enterAmount")}
                  placeholderTextColor={themeColors.card_title}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
               />

               <TextInput
                  style={[
                     styles.input,
                     { backgroundColor: themeColors.page_background, color: themeColors.card_title, borderColor: themeColors.frame_stroke },
                  ]}
                  placeholder={t("expense.enterPaymentMethod")}
                  placeholderTextColor={themeColors.card_title}
                  value={method}
                  onChangeText={setMethod}
               />

               <View style={styles.typeContainer}>
                  <TouchableOpacity
                     style={[styles.typeButton, isRecurring && styles.selectedType, { borderColor: themeColors.frame_stroke }]}
                     onPress={() => setIsRecurring(true)}>
                     <Text style={[styles.typeText, { color: isRecurring ? "white" : themeColors.card_title }]}>{t("periodic")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[styles.typeButton, !isRecurring && styles.selectedType, { borderColor: themeColors.frame_stroke }]}
                     onPress={() => setIsRecurring(false)}>
                     <Text style={[styles.typeText, { color: !isRecurring ? "white" : themeColors.card_title }]}>{t("oneTime")}</Text>
                  </TouchableOpacity>
               </View>

               <View style={[styles.pickerContainer, { borderColor: themeColors.frame_stroke }]}>
                  <Picker
                     selectedValue={categoryId}
                     onValueChange={(itemValue) => setCategoryId(Number(itemValue))}
                     style={[
                        styles.picker,
                        {
                           color: themeColors.card_title,
                           fontSize: 14,
                        },
                     ]}
                     dropdownIconColor={themeColors.card_title}>
                     <Picker.Item
                        label={t("expense.selectCategory")}
                        value={0}
                        enabled={false}
                        color={themeColors.card_description}
                        style={{ fontSize: 14 }}
                     />
                     {categories.map((category) => (
                        <Picker.Item
                           key={category.id}
                           label={getTranslatedCategoryName(category.name)}
                           value={category.id}
                           style={{ fontSize: 14 }}
                        />
                     ))}
                  </Picker>
               </View>

               <TouchableOpacity style={[styles.addButton, { backgroundColor: themeColors.green }]} onPress={handleAdd}>
                  <Text style={styles.addButtonText}>{t("expense.addButton")}</Text>
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
      padding: 20,
      borderRadius: 24,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
   },
   modalTitle: {
      fontSize: 24,
      fontWeight: "600",
      marginBottom: 20,
      textAlign: "center",
   },
   input: {
      height: 50,
      borderWidth: 1,
      borderRadius: 25,
      paddingHorizontal: 20,
      marginBottom: 16,
      fontSize: 16,
   },
   typeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
   },
   typeButton: {
      flex: 1,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 25,
      marginHorizontal: 8,
   },
   selectedType: {
      backgroundColor: "#333",
   },
   typeText: {
      fontSize: 16,
      fontWeight: "500",
   },
   pickerContainer: {
      borderWidth: 1,
      borderRadius: 25,
      marginBottom: 20,
      overflow: "hidden",
   },
   picker: {
      height: 50,
      width: "100%",
   },
   addButton: {
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 25,
   },
   addButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "600",
   },
});

export default AddExpenseModal;
