import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Platform } from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import DateTimePicker from "@react-native-community/datetimepicker";

interface AddGoalModalProps {
   visible: boolean;
   onClose: () => void;
   onAdd: (goal: { name: string; targetAmount: number; initialDeposit: number; daysToTarget: number }) => void;
   isDarkMode: boolean;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ visible, onClose, onAdd, isDarkMode }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t, i18n } = useTranslation();

   const [goalName, setGoalName] = useState("");
   const [targetAmount, setTargetAmount] = useState("");
   const [initialDeposit, setInitialDeposit] = useState(""); // Changed to empty string instead of "0"
   const [targetDate, setTargetDate] = useState(new Date());
   const [showDatePicker, setShowDatePicker] = useState(false);

   // Define translations
   const translations: Record<
      "en" | "tr",
      {
         enterGoalName: string;
         enterTargetAmount: string;
         enterInitialDeposit: string;
         selectTargetDate: string;
      }
   > = {
      en: {
         enterGoalName: "Enter goal name",
         enterTargetAmount: "Enter target amount",
         enterInitialDeposit: "Enter initial deposit amount",
         selectTargetDate: "Select target date",
      },
      tr: {
         enterGoalName: "Hedef adını girin",
         enterTargetAmount: "Hedef tutarı girin",
         enterInitialDeposit: "Başlangıç mevduat tutarını girin",
         selectTargetDate: "Hedef tarihi seçin",
      },
   };

   // Initialize placeholders
   const [goalNamePlaceholder, setGoalNamePlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterGoalName);
   const [targetAmountPlaceholder, setTargetAmountPlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterTargetAmount);
   const [initialDepositPlaceholder, setInitialDepositPlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterInitialDeposit);
   const [datePickerText, setDatePickerText] = useState(translations[i18n.language as "en" | "tr"].selectTargetDate);

   // Update placeholders when language changes
   useEffect(() => {
      const lang = i18n.language as "en" | "tr";
      setGoalNamePlaceholder(translations[lang].enterGoalName);
      setTargetAmountPlaceholder(translations[lang].enterTargetAmount);
      setInitialDepositPlaceholder(translations[lang].enterInitialDeposit);
      setDatePickerText(translations[lang].selectTargetDate);
   }, [i18n.language]);

   // Calculate days between now and target date
   const calculateDaysToTarget = (selectedDate: Date): number => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const targetDay = new Date(selectedDate);
      targetDay.setHours(0, 0, 0, 0);

      const differenceInTime = targetDay.getTime() - today.getTime();
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

      return Math.max(0, differenceInDays); // Ensure we don't return negative days
   };

   // Format date for display
   const formatDate = (date: Date): string => {
      return date.toLocaleDateString(i18n.language === "tr" ? "tr-TR" : "en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   const handleDateChange = (event: any, selectedDate?: Date) => {
      setShowDatePicker(Platform.OS === "ios");

      if (selectedDate) {
         setTargetDate(selectedDate);
      }
   };

   const handleSubmit = () => {
      const amount = parseFloat(targetAmount);

      // Fix the initial deposit parsing issue
      let deposit = 0;
      if (initialDeposit !== "") {
         deposit = parseFloat(initialDeposit);
         if (isNaN(deposit)) deposit = 0;
      }

      const daysToTarget = calculateDaysToTarget(targetDate);

      // Validate initial deposit is not greater than target amount
      if (deposit > amount) {
         // You could show an error message here
         return;
      }

      if (goalName && !isNaN(amount) && amount > 0 && daysToTarget > 0) {
         // Explicitly log the value to verify it's correct
         console.log("Adding goal with initial deposit:", deposit);

         onAdd({
            name: goalName,
            targetAmount: amount,
            initialDeposit: deposit, // Make sure this value is correct
            daysToTarget: daysToTarget,
         });

         // Reset form
         setGoalName("");
         setTargetAmount("");
         setInitialDeposit(""); // Reset to empty string
         setTargetDate(new Date());
         // Close the modal
         onClose();
      }
   };

   const resetAndClose = () => {
      setGoalName("");
      setTargetAmount("");
      setInitialDeposit(""); // Reset to empty string
      setTargetDate(new Date());
      onClose();
   };

   return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={resetAndClose} statusBarTranslucent={true}>
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={resetAndClose}>
            <TouchableOpacity
               activeOpacity={1}
               onPress={(e) => e.stopPropagation()}
               style={[styles.modalContent, { backgroundColor: themeColors.page_background }]}>
               <Text style={[styles.modalTitle, { color: themeColors.card_title }]}>{t("addGoalModalTitle")}</Text>

               {/* Goal Name Input */}
               <TextInput
                  style={[
                     styles.input,
                     {
                        backgroundColor: themeColors.page_background,
                        color: themeColors.card_title,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  placeholder={goalNamePlaceholder}
                  placeholderTextColor={themeColors.card_description}
                  value={goalName}
                  onChangeText={setGoalName}
               />

               {/* Target Amount Input */}
               <TextInput
                  style={[
                     styles.input,
                     {
                        backgroundColor: themeColors.page_background,
                        color: themeColors.card_title,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  placeholder={targetAmountPlaceholder}
                  placeholderTextColor={themeColors.card_description}
                  keyboardType="numeric"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
               />

               {/* Initial Deposit Input */}
               <TextInput
                  style={[
                     styles.input,
                     {
                        backgroundColor: themeColors.page_background,
                        color: themeColors.card_title,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  placeholder={initialDepositPlaceholder}
                  placeholderTextColor={themeColors.card_description}
                  keyboardType="numeric"
                  value={initialDeposit}
                  onChangeText={setInitialDeposit}
               />

               {/* Date Picker */}
               <TouchableOpacity
                  style={[
                     styles.datePickerButton,
                     {
                        backgroundColor: themeColors.page_background,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  onPress={() => setShowDatePicker(true)}>
                  <Text style={{ color: themeColors.card_title }}>{targetDate > new Date() ? formatDate(targetDate) : datePickerText}</Text>
               </TouchableOpacity>

               {showDatePicker && (
                  <DateTimePicker
                     value={targetDate}
                     mode="date"
                     display="spinner"
                     onChange={handleDateChange}
                     minimumDate={new Date()}
                     themeVariant={isDarkMode ? "dark" : "light"}
                  />
               )}
               {/* Add Button */}
               <TouchableOpacity
                  style={[
                     styles.addButton,
                     {
                        backgroundColor: themeColors.green || "#4CAF50",
                     },
                  ]}
                  onPress={handleSubmit}>
                  <Text style={styles.addButtonText}>{t("addGoalButtonText")}</Text>
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
   datePickerButton: {
      height: 50,
      borderWidth: 1,
      borderRadius: 25,
      paddingHorizontal: 20,
      marginBottom: 16,
      fontSize: 16,
      justifyContent: "center",
   },
   daysText: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 16,
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

export default AddGoalModal;
