import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";
import { CategoryDto } from "../src/api/types";

interface CategoryModalProps {
   visible: boolean;
   onClose: () => void;
   onSave: (name: string) => void;
   category?: CategoryDto | null;
   isDarkMode: boolean;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ visible, onClose, onSave, category, isDarkMode }) => {
   const { t } = useTranslation();
   const themeColors = getThemeColors(isDarkMode);
   const [name, setName] = useState("");

   useEffect(() => {
      if (category) {
         setName(category.name ?? "");
      } else {
         setName("");
      }
   }, [category, visible]);

   const handleSave = () => {
      if (name.trim()) {
         onSave(name.trim());
         setName("");
         onClose();
      }
   };

   const handleClose = () => {
      setName("");
      onClose();
   };

   return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose} statusBarTranslucent={true}>
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
            <TouchableOpacity
               activeOpacity={1}
               onPress={(e) => e.stopPropagation()}
               style={[styles.modalContent, { backgroundColor: themeColors.card_background || themeColors.page_background }]}>
               <Text style={[styles.modalTitle, { color: themeColors.card_title }]}>
                  {category ? t("categoryManagement.editCategory") : t("categoryManagement.addCategory")}
               </Text>

               <TextInput
                  style={[
                     styles.input,
                     {
                        backgroundColor: themeColors.page_background,
                        color: themeColors.card_title,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  placeholder={t("categoryManagement.categoryNamePlaceholder")}
                  placeholderTextColor={themeColors.card_title + "80"}
                  value={name}
                  onChangeText={setName}
                  autoFocus={true}
               />

               <TouchableOpacity style={[styles.saveButton, { backgroundColor: themeColors.green }]} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>{category ? t("categoryManagement.save") || "Save" : t("categoryManagement.addCategoryButton")}</Text>
               </TouchableOpacity>
            </TouchableOpacity>
         </TouchableOpacity>
      </Modal>
   );
};

const styles = StyleSheet.create({
   modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
   },
   modalContent: {
      width: "85%",
      padding: moderateScale(24),
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
      fontSize: moderateScale(22),
      fontWeight: "700",
      marginBottom: verticalScale(24),
      textAlign: "center",
   },
   input: {
      height: verticalScale(55),
      borderWidth: 1,
      borderRadius: moderateScale(16),
      paddingHorizontal: horizontalScale(16),
      marginBottom: verticalScale(24),
      fontSize: moderateScale(16),
   },
   saveButton: {
      height: verticalScale(55),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: moderateScale(16),
   },
   saveButtonText: {
      color: "white",
      fontSize: moderateScale(18),
      fontWeight: "600",
   },
});

export default CategoryModal;
