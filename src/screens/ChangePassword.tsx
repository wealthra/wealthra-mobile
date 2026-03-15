import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { getThemeColors } from "../utils/getThemeColors";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import SideDrawer from "../../components/SideDrawer";
import { changePassword } from "../services/api";

interface ChangePasswordProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ isDarkMode, navigation }) => {
   const { t } = useTranslation();
   const themeColors = getThemeColors(isDarkMode);

   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [currentPassword, setCurrentPassword] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isSuccess, setIsSuccess] = useState(false);
   const [passwordVisible, setPasswordVisible] = useState({
      newPassword: false,
      confirmPassword: false,
      currentPassword: false,
   });

   // Toggle password visibility
   const togglePasswordVisibility = (field: keyof typeof passwordVisible) => {
      setPasswordVisible({
         ...passwordVisible,
         [field]: !passwordVisible[field],
      });
   };

   const handleSubmit = async () => {
      // Reset states
      setError(null);
      setIsSuccess(false);

      // Field validation
      if (!newPassword || !confirmPassword || !currentPassword) {
         setError(t("changePassword.allFieldsRequired"));
         return;
      }

      // Password complexity checks
      if (newPassword.length < 8) {
         setError(t("passwordTooShort"));
         return;
      }

      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      const hasCapitalLetter = /[A-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);

      if (!hasSpecialChar) {
         setError(t("passwordNeedsSpecialChar"));
         return;
      }

      if (!hasCapitalLetter) {
         setError(t("passwordNeedsCapital"));
         return;
      }

      if (!hasNumber) {
         setError(t("passwordNeedsNumber"));
         return;
      }

      // Password match validation
      if (newPassword !== confirmPassword) {
         setError(t("passwordsDoNotMatch"));
         return;
      }

      // Check if new password is same as current password
      if (newPassword === currentPassword) {
         setError(t("changePassword.samePassword"));
         return;
      }

      setIsSubmitting(true);

      try {
         await changePassword(currentPassword, newPassword, newPassword);
         setIsSuccess(true);
         setError(null);

         // Reset fields after successful password change
         setNewPassword("");
         setConfirmPassword("");
         setCurrentPassword("");

         // Navigate back after a short delay
         setTimeout(() => {
            navigation.goBack();
         }, 1500);
      } catch (error: any) {
         console.error("Error changing password:", error);
         setError(error.message || t("changePassword.failedToChange"));
         setIsSuccess(false);
      } finally {
         setIsSubmitting(false);
      }
   };

   function handleNavigate(screen: string): void {
      navigation.navigate(screen);
   }

   return (
      <View style={[styles.container, { backgroundColor: themeColors.page_background }]}>
         {/* Header */}
         <View style={styles.header}>
            <SideDrawer isDarkMode={isDarkMode} onNavigate={handleNavigate} currentRoute="changePassword" />
         </View>

         <View style={styles.content}>
            {/* New Password */}
            <View style={styles.inputGroup}>
               <Text style={[styles.inputLabel, { color: themeColors.card_description }]}>{t("changePassword.newPassword")}</Text>
               <View style={styles.passwordContainer}>
                  <TextInput
                     style={[
                        styles.input,
                        {
                           color: themeColors.card_title,
                           backgroundColor: themeColors.page_background,
                           borderColor: themeColors.frame_stroke,
                        },
                     ]}
                     placeholder={t("changePassword.newPasswordPlaceholder")}
                     placeholderTextColor={themeColors.card_description}
                     secureTextEntry={!passwordVisible.newPassword}
                     value={newPassword}
                     onChangeText={(text) => {
                        setNewPassword(text);
                        setError(null);
                     }}
                  />
               </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputGroup}>
               <Text style={[styles.inputLabel, { color: themeColors.card_description }]}>{t("changePassword.confirmNewPassword")}</Text>
               <View style={styles.passwordContainer}>
                  <TextInput
                     style={[
                        styles.input,
                        {
                           color: themeColors.card_title,
                           backgroundColor: themeColors.page_background,
                           borderColor: themeColors.frame_stroke,
                        },
                     ]}
                     placeholder={t("changePassword.confirmPasswordPlaceholder")}
                     placeholderTextColor={themeColors.card_description}
                     secureTextEntry={!passwordVisible.confirmPassword}
                     value={confirmPassword}
                     onChangeText={(text) => {
                        setConfirmPassword(text);
                        setError(null);
                     }}
                  />
               </View>
            </View>

            {/* Current Password */}
            <View style={styles.inputGroup}>
               <Text style={[styles.inputLabel, { color: themeColors.card_description }]}>{t("changePassword.currentPassword")}</Text>
               <View style={styles.passwordContainer}>
                  <TextInput
                     style={[
                        styles.input,
                        {
                           color: themeColors.card_title,
                           backgroundColor: themeColors.page_background,
                           borderColor: themeColors.frame_stroke,
                        },
                     ]}
                     placeholder={t("changePassword.currentPasswordPlaceholder")}
                     placeholderTextColor={themeColors.card_description}
                     secureTextEntry={!passwordVisible.currentPassword}
                     value={currentPassword}
                     onChangeText={(text) => {
                        setCurrentPassword(text);
                        setError(null);
                     }}
                  />
               </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: themeColors.green }]} onPress={handleSubmit} disabled={isSubmitting}>
               {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
               ) : (
                  <Text style={styles.saveButtonText}>{t("changePassword.changePasswordButtonText")}</Text>
               )}
            </TouchableOpacity>

            {/* Error Message */}
            {error && <Text style={[styles.errorText, { color: themeColors.red }]}>{error}</Text>}

            {/* Success Message */}
            {isSuccess && <Text style={[styles.successText, { color: themeColors.green }]}>{t("changePassword.passwordChanged")}</Text>}
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      paddingTop: 50,
   },
   header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 30,
   },
   backButton: {
      marginRight: 10,
   },
   screenTitle: {
      fontSize: 36,
      fontWeight: "bold",
   },
   content: {
      paddingHorizontal: 20,
      marginTop: 30,
   },
   inputGroup: {
      marginBottom: 24,
   },
   inputLabel: {
      fontSize: 18,
      marginBottom: 8,
   },
   passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      position: "relative",
   },
   input: {
      height: 50,
      width: "100%",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 16,
   },
   visibilityToggle: {
      position: "absolute",
      right: 12,
   },
   saveButton: {
      height: 50,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
   },
   saveButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "500",
   },
   errorText: {
      textAlign: "center",
      marginTop: 16,
      fontSize: 14,
   },
   successText: {
      textAlign: "center",
      marginTop: 16,
      fontSize: 14,
   },
});

export default ChangePassword;
