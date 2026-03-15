import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Platform, Alert } from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";
import DateTimePicker from "@react-native-community/datetimepicker";

interface UpdateGoalModalProps {
   visible: boolean;
   onClose: () => void;
   onUpdate: (goal: { name: string; targetAmount: number; initialDeposit: number; daysToTarget: number }) => void;
   initialValues?: {
      id: string;
      name: string;
      saved: number;
      target: number;
      daysLeft: number;
   };
   isDarkMode: boolean;
}

const UpdateGoalModal: React.FC<UpdateGoalModalProps> = ({ visible, onClose, onUpdate, initialValues, isDarkMode }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t } = useTranslation();

   const [goalName, setGoalName] = useState("");
   const [targetAmount, setTargetAmount] = useState("");
   const [initialDeposit, setInitialDeposit] = useState("");
   const [targetDate, setTargetDate] = useState(new Date());
   const [showDatePicker, setShowDatePicker] = useState(false);

   // Initialize form with values from the selected goal when it changes
   useEffect(() => {
      if (initialValues) {
         setGoalName(initialValues.name);
         setTargetAmount(initialValues.target.toString());
         setInitialDeposit(initialValues.saved.toString());

         // Calculate target date from days left
         const date = new Date();
         date.setDate(date.getDate() + initialValues.daysLeft);
         setTargetDate(date);
      }
   }, [initialValues, visible]);

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
      return date.toLocaleDateString(t("locale") === "tr-TR" ? "tr-TR" : "en-US", {
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
      let deposit = parseFloat(initialDeposit || "0");
      if (isNaN(deposit)) deposit = 0;

      const daysToTarget = calculateDaysToTarget(targetDate);

      // Validate inputs
      if (!goalName || isNaN(amount) || amount <= 0 || daysToTarget <= 0) {
         Alert.alert(t("alert.genericErrorTitle"), t("alert.invalidInputs"));
         return;
      }

      // Validate initial deposit is not greater than target amount
      if (deposit > amount) {
         Alert.alert(t("error"), t("depositExceedsTarget"));
         return;
      }

      onUpdate({
         name: goalName,
         targetAmount: amount,
         initialDeposit: deposit,
         daysToTarget: daysToTarget,
      });
   };

   return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose} statusBarTranslucent={true}>
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <TouchableOpacity
               activeOpacity={1}
               onPress={(e) => e.stopPropagation()}
               style={[styles.modalContent, { backgroundColor: themeColors.page_background }]}>
               <Text style={[styles.modalTitle, { color: themeColors.card_title }]}>{t("updateGoalModalTitle")}</Text>

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
                  placeholder={t("goal.enterTargetAmount")}
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
                  placeholder={t("goal.enterCurrentAmount")}
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
                  <Text style={{ color: themeColors.card_title }}>{formatDate(targetDate)}</Text>
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

               {/* Update Button */}
               <TouchableOpacity
                  style={[
                     styles.updateButton,
                     {
                        backgroundColor: themeColors.green || "#4CAF50",
                     },
                  ]}
                  onPress={handleSubmit}>
                  <Text style={styles.updateButtonText}>{t("goal.updateButton")}</Text>
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
   datePickerButton: {
      height: verticalScale(50),
      borderWidth: 1,
      borderRadius: moderateScale(25),
      paddingHorizontal: horizontalScale(20),
      marginBottom: verticalScale(16),
      fontSize: moderateScale(16),
      justifyContent: "center",
   },
   updateButton: {
      height: verticalScale(50),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: moderateScale(25),
   },
   updateButtonText: {
      color: "white",
      fontSize: moderateScale(18),
      fontWeight: "600",
   },
});

export default UpdateGoalModal;
