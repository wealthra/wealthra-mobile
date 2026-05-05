import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";
import DateTimePicker from "@react-native-community/datetimepicker";

interface UpdateIncomeModalProps {
   visible: boolean;
   onClose: () => void;
   onUpdate: (id: number, income: { name: string; amount: number; method: string; isRecurring: boolean; transactionDate: string }) => void;
   isDarkMode: boolean;
   initialIncome: {
      id: number;
      name: string;
      amount: number;
      method: string;
      isRecurring: boolean;
      transactionDate: string;
   } | null;
}

const UpdateIncomeModal: React.FC<UpdateIncomeModalProps> = ({ visible, onClose, onUpdate, isDarkMode, initialIncome }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t, i18n } = useTranslation();
   const [name, setName] = useState("");
   const [amount, setAmount] = useState("");
   const [method, setMethod] = useState("");
   const [isRecurring, setIsRecurring] = useState(true);
   const [transactionDate, setTransactionDate] = useState(new Date());
   const [showDatePicker, setShowDatePicker] = useState(false);

   useEffect(() => {
      if (initialIncome) {
         setName(initialIncome.name || "");
         setAmount(initialIncome.amount?.toString() || "");
         setMethod(initialIncome.method || "");
         setIsRecurring(initialIncome.isRecurring ?? true);
         setTransactionDate(initialIncome.transactionDate ? new Date(initialIncome.transactionDate) : new Date());
      }
   }, [initialIncome, visible]);

   const handleUpdate = () => {
      if (initialIncome && name && amount && method) {
         onUpdate(initialIncome.id, {
            name,
            amount: Number(amount),
            method,
            isRecurring,
            transactionDate: transactionDate.toISOString(),
         });
         onClose();
      }
   };

   const handleDateChange = (event: any, selectedDate?: Date) => {
      setShowDatePicker(Platform.OS === "ios");
      if (selectedDate) {
         setTransactionDate(selectedDate);
      }
   };

   const formatDate = (date: Date): string => {
      return date.toLocaleDateString(i18n.language === "tr" ? "tr-TR" : "en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose} statusBarTranslucent={true}>
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <TouchableOpacity
               activeOpacity={1}
               onPress={(e) => e.stopPropagation()}
               style={[styles.modalContent, { backgroundColor: themeColors.page_background }]}>
               <Text style={[styles.modalTitle, { color: themeColors.card_title }]}>{t("updateIncomeModalTitle")}</Text>

               <TextInput
                  style={[
                     styles.input,
                     { backgroundColor: themeColors.page_background, color: themeColors.card_title, borderColor: themeColors.frame_stroke },
                  ]}
                  placeholder={t("income.enterIncomeName") || "Enter income name"}
                  placeholderTextColor={themeColors.card_title}
                  value={name}
                  onChangeText={setName}
               />

               <TextInput
                  style={[
                     styles.input,
                     { backgroundColor: themeColors.page_background, color: themeColors.card_title, borderColor: themeColors.frame_stroke },
                  ]}
                  placeholder={t("income.enterIncomeAmount") || "Enter income amount"}
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
                  placeholder={t("income.enterIncomePaymentMethod") || "Enter payment method"}
                  placeholderTextColor={themeColors.card_title}
                  value={method}
                  onChangeText={setMethod}
               />

               <View style={styles.typeContainer}>
                  <TouchableOpacity
                     style={[
                        styles.typeButton,
                        isRecurring ? { backgroundColor: themeColors.green, borderColor: themeColors.green } : { borderColor: themeColors.frame_stroke },
                     ]}
                     onPress={() => setIsRecurring(true)}>
                     <Text style={[styles.typeText, { color: isRecurring ? "white" : themeColors.card_title }]}>{t("periodic")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[
                        styles.typeButton,
                        !isRecurring ? { backgroundColor: themeColors.green, borderColor: themeColors.green } : { borderColor: themeColors.frame_stroke },
                     ]}
                     onPress={() => setIsRecurring(false)}>
                     <Text style={[styles.typeText, { color: !isRecurring ? "white" : themeColors.card_title }]}>{t("oneTime")}</Text>
                  </TouchableOpacity>
               </View>

               <TouchableOpacity
                  style={[
                     styles.datePickerButton,
                     {
                        backgroundColor: themeColors.page_background,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  onPress={() => setShowDatePicker(true)}>
                  <Text style={{ color: themeColors.card_title }}>{formatDate(transactionDate)}</Text>
               </TouchableOpacity>

               {showDatePicker && (
                  <DateTimePicker
                     value={transactionDate}
                     mode="date"
                     display="spinner"
                     onChange={handleDateChange}
                     maximumDate={new Date()}
                     themeVariant={isDarkMode ? "dark" : "light"}
                  />
               )}

               <TouchableOpacity style={[styles.addButton, { backgroundColor: themeColors.green }]} onPress={handleUpdate}>
                  <Text style={styles.addButtonText}>{t("updateIncomeButtonText")}</Text>
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
   typeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: verticalScale(20),
   },
   typeButton: {
      flex: 1,
      height: verticalScale(50),
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: moderateScale(25),
      marginHorizontal: horizontalScale(8),
   },
   selectedType: {
      backgroundColor: "#333",
   },
   typeText: {
      fontSize: moderateScale(16),
      fontWeight: "500",
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

export default UpdateIncomeModal;
