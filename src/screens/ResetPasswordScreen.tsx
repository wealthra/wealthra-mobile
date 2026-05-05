import React, { useState } from "react";
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   TextInput,
   KeyboardAvoidingView,
   Platform,
   ActivityIndicator,
   ScrollView,
} from "react-native";
import { getThemeColors } from "../utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { resetPassword } from "../api/services/authService";
import { horizontalScale, verticalScale, moderateScale } from "../utils/scaling";

interface ResetPasswordScreenProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
   route: any;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ isDarkMode, navigation, route }) => {
   const { t } = useTranslation();
   const themeColors = getThemeColors(isDarkMode);
   const { email: initialEmail } = route.params || {};

   const [email, setEmail] = useState(initialEmail || "");
   const [code, setCode] = useState("");
   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isSuccess, setIsSuccess] = useState(false);

   const handleResetPassword = async () => {
      try {
         if (!email || !code || !newPassword || !confirmPassword) {
            setError(t("allFieldsRequired") || "All fields are required");
            return;
         }

         if (newPassword !== confirmPassword) {
            setError(t("passwordsDoNotMatch") || "Passwords do not match");
            return;
         }

         setIsLoading(true);
         setError(null);

         await resetPassword({
            email,
            code,
            newPassword,
         });

         setIsSuccess(true);
      } catch (error: any) {
         console.error("Reset Password error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
         });

         if (error.response?.status === 400) {
            setError(t("invalidResetCode") || "Invalid or expired reset code");
         } else if (error.response?.status === 404) {
            setError(t("userNotFound") || "User not found");
         } else {
            setError(t("passwordResetError") || "Could not reset password. Please try again.");
         }
      } finally {
         setIsLoading(false);
      }
   };

   if (isSuccess) {
      return (
         <View style={[styles.container, { backgroundColor: themeColors.page_background }]}>
            <View style={styles.successContainer}>
               <Ionicons name="checkmark-circle" size={moderateScale(80)} color={themeColors.green} />
               <Text style={[styles.successTitle, { color: themeColors.card_title }]}>
                  {t("resetSuccessTitle") || "Success!"}
               </Text>
               <Text style={[styles.successDescription, { color: themeColors.card_description }]}>
                  {t("resetSuccessDescription") || "Your password has been successfully reset."}
               </Text>
               <TouchableOpacity
                  style={[styles.loginButton, { backgroundColor: themeColors.green }]}
                  onPress={() => navigation.navigate("Login")}
               >
                  <Text style={styles.loginButtonText}>{t("backToLogin") || "Back to Login"}</Text>
               </TouchableOpacity>
            </View>
         </View>
      );
   }

   return (
      <KeyboardAvoidingView
         behavior={Platform.OS === "ios" ? "padding" : "height"}
         style={[styles.container, { backgroundColor: themeColors.page_background }]}
      >
         <ScrollView contentContainerStyle={styles.scrollContent}>


            <View style={styles.headerContainer}>
               <Text style={[styles.title, { color: themeColors.card_title }]}>
                  {t("resetPasswordTitle") || "Reset Password"}
               </Text>
               <Text style={[styles.subtitle, { color: themeColors.card_description }]}>
                  {t("resetPasswordSubtitle") || "Enter the code sent to your email and your new password."}
               </Text>
            </View>

            <View style={styles.formContainer}>
               <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: themeColors.card_title }]}>{t("email")}</Text>
                  <TextInput
                     style={[
                        styles.input,
                        {
                           backgroundColor: themeColors.card_background,
                           color: themeColors.card_title,
                           borderColor: themeColors.frame_stroke,
                        },
                     ]}
                     placeholder={t("emailPlaceholder")}
                     placeholderTextColor={themeColors.card_description}
                     value={email}
                     onChangeText={setEmail}
                     keyboardType="email-address"
                     autoCapitalize="none"
                  />
               </View>

               <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: themeColors.card_title }]}>{t("resetCode") || "Reset Code"}</Text>
                  <TextInput
                     style={[
                        styles.input,
                        {
                           backgroundColor: themeColors.card_background,
                           color: themeColors.card_title,
                           borderColor: themeColors.frame_stroke,
                        },
                     ]}
                     placeholder={t("resetCodePlaceholder") || "Enter code"}
                     placeholderTextColor={themeColors.card_description}
                     value={code}
                     onChangeText={setCode}
                     keyboardType="number-pad"
                  />
               </View>

               <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: themeColors.card_title }]}>{t("newPassword")}</Text>
                  <TextInput
                     style={[
                        styles.input,
                        {
                           backgroundColor: themeColors.card_background,
                           color: themeColors.card_title,
                           borderColor: themeColors.frame_stroke,
                        },
                     ]}
                     placeholder={t("newPasswordPlaceholder")}
                     placeholderTextColor={themeColors.card_description}
                     value={newPassword}
                     onChangeText={setNewPassword}
                     secureTextEntry={true}
                  />
               </View>

               <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: themeColors.card_title }]}>{t("confirmPassword")}</Text>
                  <TextInput
                     style={[
                        styles.input,
                        {
                           backgroundColor: themeColors.card_background,
                           color: themeColors.card_title,
                           borderColor: themeColors.frame_stroke,
                        },
                     ]}
                     placeholder={t("confirmPasswordPlaceholder")}
                     placeholderTextColor={themeColors.card_description}
                     value={confirmPassword}
                     onChangeText={setConfirmPassword}
                     secureTextEntry={true}
                  />
               </View>

               {error && <Text style={styles.errorText}>{error}</Text>}

               <TouchableOpacity
                  style={[styles.resetButton, { backgroundColor: themeColors.green }]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
               >
                  {isLoading ? (
                     <ActivityIndicator color="#fff" />
                  ) : (
                     <Text style={styles.resetButtonText}>{t("resetPassword")}</Text>
                  )}
               </TouchableOpacity>
            </View>
         </ScrollView>
      </KeyboardAvoidingView>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   scrollContent: {
      flexGrow: 1,
      paddingHorizontal: horizontalScale(20),
      paddingTop: verticalScale(60),
      paddingBottom: verticalScale(40),
   },
   headerContainer: {
      marginBottom: verticalScale(40),
   },
   title: {
      fontSize: moderateScale(28),
      fontWeight: "bold",
      marginBottom: verticalScale(10),
   },
   subtitle: {
      fontSize: moderateScale(16),
      lineHeight: moderateScale(24),
   },
   formContainer: {
      width: "100%",
   },
   inputContainer: {
      marginBottom: verticalScale(20),
   },
   label: {
      fontSize: moderateScale(14),
      fontWeight: "600",
      marginBottom: verticalScale(8),
   },
   input: {
      height: verticalScale(55),
      borderRadius: moderateScale(12),
      paddingHorizontal: horizontalScale(15),
      borderWidth: 1,
      fontSize: moderateScale(16),
   },
   errorText: {
      color: "#FF3B30",
      fontSize: moderateScale(14),
      marginBottom: verticalScale(20),
      textAlign: "center",
   },
   resetButton: {
      height: verticalScale(55),
      borderRadius: moderateScale(12),
      justifyContent: "center",
      alignItems: "center",
      marginTop: verticalScale(10),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
   },
   resetButtonText: {
      color: "#fff",
      fontSize: moderateScale(18),
      fontWeight: "bold",
   },
   successContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: horizontalScale(30),
   },
   successTitle: {
      fontSize: moderateScale(24),
      fontWeight: "bold",
      marginTop: verticalScale(20),
      marginBottom: verticalScale(10),
   },
   successDescription: {
      fontSize: moderateScale(16),
      textAlign: "center",
      lineHeight: moderateScale(24),
      marginBottom: verticalScale(40),
   },
   loginButton: {
      width: "100%",
      height: verticalScale(55),
      borderRadius: moderateScale(12),
      justifyContent: "center",
      alignItems: "center",
   },
   loginButtonText: {
      color: "#fff",
      fontSize: moderateScale(18),
      fontWeight: "bold",
   },
});

export default ResetPasswordScreen;
