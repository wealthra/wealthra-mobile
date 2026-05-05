import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";

interface AddIncomeModalProps {
   visible: boolean;
   onClose: () => void;
   onAdd: (income: { name: string; amount: number; method: string; isRecurring: boolean; transactionDate: string }) => void;
   isDarkMode: boolean;
}

const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ visible, onClose, onAdd, isDarkMode }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t, i18n } = useTranslation();
   const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
   const [name, setName] = useState("");
   const [amount, setAmount] = useState("");
   const [method, setMethod] = useState("");
   const [isRecurring, setIsRecurring] = useState(true);

   // Define translations
   const translations: Record<
      "en" | "tr",
      {
         enterIncomeName: string;
         enterIncomeAmount: string;
         enterIncomePaymentMethod: string;
      }
   > = {
      en: {
         enterIncomeName: "Enter income name",
         enterIncomeAmount: "Enter income amount",
         enterIncomePaymentMethod: "Enter income payment method",
      },
      tr: {
         enterIncomeName: "Gelir adını girin",
         enterIncomeAmount: "Gelir miktarını girin",
         enterIncomePaymentMethod: "Gelir ödeme yöntemini girin",
      },
   };

   // Initialize placeholders with correct language
   const [incomeNamePlaceholder, setIncomeNamePlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterIncomeName);
   const [incomeAmountPlaceholder, setIncomeAmountPlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterIncomeAmount);
   const [incomeMethodPlaceholder, setIncomeMethodPlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterIncomePaymentMethod);

   // Update placeholders when language changes
   useEffect(() => {
      const lang = i18n.language as "en" | "tr";
      setIncomeNamePlaceholder(translations[lang].enterIncomeName);
      setIncomeAmountPlaceholder(translations[lang].enterIncomeAmount);
      setIncomeMethodPlaceholder(translations[lang].enterIncomePaymentMethod);
   }, [i18n.language]);

   const handleAdd = () => {
      if (name && amount && method) {
         onAdd({
            name,
            amount: Number(amount),
            method,
            isRecurring,
            transactionDate: new Date().toISOString(),
         });
         setName("");
         setAmount("");
         setMethod("");
         setIsRecurring(true);
         onClose();
      }
   };

   const handleClose = () => {
      setName("");
      setAmount("");
      setMethod("");
      setIsRecurring(true);
      onClose();
   };

   return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose} statusBarTranslucent={true}>
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
            <TouchableOpacity
               activeOpacity={1}
               onPress={(e) => e.stopPropagation()}
               style={[styles.modalContent, { backgroundColor: themeColors.page_background }]}>
               <Text style={[styles.modalTitle, { color: themeColors.card_title }]}>{t("addIncomeModalTitle")}</Text>

               <TextInput
                  style={[
                     styles.input,
                     {
                        backgroundColor: themeColors.page_background,
                        color: themeColors.card_title,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  placeholder={incomeNamePlaceholder}
                  placeholderTextColor={themeColors.card_title}
                  value={name}
                  onChangeText={setName}
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
                  placeholder={incomeAmountPlaceholder}
                  placeholderTextColor={themeColors.card_title}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
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
                  placeholder={incomeMethodPlaceholder}
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

               <TouchableOpacity style={[styles.addButton, { backgroundColor: themeColors.green }]} onPress={handleAdd}>
                  <Text style={styles.addButtonText}>{t("addIncomeButtonText")}</Text>
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
      shadowOffset: {
         width: 0,
         height: verticalScale(2),
      },
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
   selectedTypeText: {
      color: "white",
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

export default AddIncomeModal;
