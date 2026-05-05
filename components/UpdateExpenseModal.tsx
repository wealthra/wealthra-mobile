import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { Picker } from "@react-native-picker/picker";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";
import DateTimePicker from "@react-native-community/datetimepicker";

interface UpdateExpenseModalProps {
   visible: boolean;
   onClose: () => void;
   onUpdate: (id: number, expense: { description: string; amount: number; method: string; isRecurring: boolean; categoryId: number; transactionDate: string }) => void;
   isDarkMode: boolean;
   categories: { id: number; name: string }[];
   initialExpense: {
      id: number;
      description: string;
      amount: number;
      paymentMethod: string;
      isRecurring: boolean;
      categoryId: number;
      transactionDate: string;
   } | null;
}

const UpdateExpenseModal: React.FC<UpdateExpenseModalProps> = ({ visible, onClose, onUpdate, isDarkMode, categories, initialExpense }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t, i18n } = useTranslation();
   const [description, setDescription] = useState("");
   const [amount, setAmount] = useState("");
   const [method, setMethod] = useState("");
   const [isRecurring, setIsRecurring] = useState(true);
   const [categoryId, setCategoryId] = useState(0);
   const [transactionDate, setTransactionDate] = useState(new Date());
   const [showDatePicker, setShowDatePicker] = useState(false);

   useEffect(() => {
      if (initialExpense) {
         setDescription(initialExpense.description || "");
         setAmount(initialExpense.amount?.toString() || "");
         setMethod(initialExpense.paymentMethod || "");
         setIsRecurring(initialExpense.isRecurring ?? true);
         setCategoryId(initialExpense.categoryId || 0);
         setTransactionDate(initialExpense.transactionDate ? new Date(initialExpense.transactionDate) : new Date());
      }
   }, [initialExpense, visible]);

   const handleUpdate = () => {
      if (initialExpense && description && amount && method && categoryId > 0) {
         onUpdate(initialExpense.id, {
            description,
            amount: Number(amount),
            method,
            isRecurring,
            categoryId,
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

   const getTranslatedCategoryName = (categoryName: string) => {
      if (!categoryName) return t("categories.miscellaneous");
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
               <Text style={[styles.modalTitle, { color: themeColors.card_title }]}>{t("expense.updateExpenseTitle")}</Text>

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
                     style={[
                        styles.typeButton,
                        isRecurring ? { backgroundColor: themeColors.green, borderColor: themeColors.green } : { borderColor: themeColors.frame_stroke },
                     ]}
                     onPress={() => setIsRecurring(true)}>
                     <Text style={[styles.typeText, { color: isRecurring ? "white" : themeColors.card_title }]}>{t("expense.periodic")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[
                        styles.typeButton,
                        !isRecurring ? { backgroundColor: themeColors.green, borderColor: themeColors.green } : { borderColor: themeColors.frame_stroke },
                     ]}
                     onPress={() => setIsRecurring(false)}>
                     <Text style={[styles.typeText, { color: !isRecurring ? "white" : themeColors.card_title }]}>{t("expense.oneTime")}</Text>
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

               <TouchableOpacity style={[styles.addButton, { backgroundColor: themeColors.green }]} onPress={handleUpdate}>
                  <Text style={styles.addButtonText}>{t("expense.updateButton")}</Text>
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
   pickerContainer: {
      borderWidth: 1,
      borderRadius: moderateScale(25),
      marginBottom: verticalScale(20),
      overflow: "hidden",
   },
   picker: {
      height: verticalScale(50),
      width: "100%",
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

export default UpdateExpenseModal;
