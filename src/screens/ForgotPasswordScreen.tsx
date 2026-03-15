import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { LightMode } from "../assets/icons/LightMode";
import { DarkMode } from "../assets/icons/DarkMode";
import { LanguageIcon } from "../assets/icons/LanguageIcon";
import { SvgXml } from "react-native-svg";
import { data } from "../utils/data.js";
import { getThemeColors } from "../utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { forgotPassword } from "../services/api";

interface ForgotPasswordScreenProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

const ForgotPasswordScreen = ({ isDarkMode, onToggleTheme, navigation }: ForgotPasswordScreenProps) => {
   const { t, i18n } = useTranslation();
   const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
   const themeColors = getThemeColors(isDarkMode);
   const [email, setEmail] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isSuccess, setIsSuccess] = useState(false);

   // Manual translation map as a fallback
   const translations: Record<"en" | "tr", { enterEmail: string }> = {
      en: {
         enterEmail: "Enter your email",
      },
      tr: {
         enterEmail: "E-posta adresinizi girin",
      },
   };
   // Initialize with correct language
   const [emailPlaceholder, setEmailPlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterEmail || "Enter your email");

   const toggleLanguage = () => {
      const newLang = i18n.language === "en" ? "tr" : "en";
      i18n.changeLanguage(newLang);
      setCurrentLanguage(newLang);
      setEmailPlaceholder(translations[newLang].enterEmail);
   };

   const buttonLanguage = currentLanguage === "en" ? "TR" : "EN";

   const handleForgotPassword = async () => {
      try {
         // Validate email format
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!email) {
            setError(t("emailRequired"));
            return;
         }
         if (!emailRegex.test(email)) {
            setError(t("invalidEmailFormat"));
            return;
         }

         setIsLoading(true);
         setError(null);
         setIsSuccess(false);

         await forgotPassword(email);

         setIsSuccess(true);
         setEmail(""); // Clear email input
      } catch (error: any) {
         console.error("Forgot Password error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
         });

         // Handle specific error cases
         if (error.response?.status === 400) {
            setError(t("invalidCredentials"));
         } else if (error.response?.status === 401) {
            setError(t("unauthorized"));
         } else if (error.response?.status === 404) {
            setError(t("userNotFound"));
         } else if (error.message.includes("Network")) {
            setError(t("networkError"));
         } else {
            setError(t("generalError"));
         }
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <View style={styles.container}>
         <View style={styles.headerSection}>
            <View style={styles.headerButtons}>
               <TouchableOpacity style={styles.headerButton} onPress={toggleLanguage} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <LanguageIcon color={themeColors.card_title} size={30} />
                  <Text style={[styles.languageText, { color: themeColors.card_title }]}>{buttonLanguage}</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.headerButton} onPress={onToggleTheme} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {isDarkMode ? <LightMode color={themeColors.card_title} size={30} /> : <DarkMode color={themeColors.card_title} size={30} />}
               </TouchableOpacity>
            </View>
         </View>
         <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
               <SvgXml xml={data[0].logo ?? null} width={100} height={100} preserveAspectRatio="xMidYMid" style={{ marginBottom: -30 }} />
            </View>
            <Text style={[styles.forgotPasswordGreetingText, { color: themeColors.card_title }]}>{t("forgotPasswordGreetingText")}</Text>
         </View>
         <View style={styles.forgotPasswordSection}>
            <View style={[styles.forgotPasswordBox, { backgroundColor: themeColors.card_background, borderColor: themeColors.frame_stroke }]}>
               <Text style={[styles.forgotPasswordBoxTitle, { color: themeColors.card_title }]}>{t("forgotPasswordTitle")}</Text>
               <Text style={[styles.forgotPasswordDescriptionText, { color: themeColors.card_title }]}>{t("forgotPasswordDescription")}</Text>
               <View style={styles.forgotPasswordInputSection}>
                  <View
                     style={[
                        styles.inputContainer,
                        { borderColor: themeColors.frame_stroke },
                        { backgroundColor: themeColors.text_input_background },
                     ]}>
                     <SvgXml xml={data[4].email ?? null} width={20} height={20} preserveAspectRatio="xMidYMid" />
                     <View style={[styles.verticalSeparator, { backgroundColor: themeColors.frame_stroke }]} />
                     <TextInput
                        style={[styles.input, { color: themeColors.card_title }]}
                        placeholder={emailPlaceholder}
                        placeholderTextColor={themeColors.card_title}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                     />
                  </View>
               </View>
               <TouchableOpacity
                  style={[styles.forgotPasswordButton, { backgroundColor: themeColors.green }, isLoading && { opacity: 0.7 }]}
                  onPress={handleForgotPassword}
                  disabled={isLoading}>
                  <Text style={styles.forgotPasswordButtonText}>{isLoading ? t("loggingIn") : t("forgotPasswordButtonText")}</Text>
               </TouchableOpacity>
            </View>
         </View>
         <View style={styles.forgotPasswordPageFooter}>
            <Text style={[styles.forgotPasswordPageFooterText, { color: themeColors.card_title }]}>{t("rememberYourPassword")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
               <Text style={[styles.forgotPasswordPageFooterText, { color: themeColors.blue }]}>{t("login")}</Text>
            </TouchableOpacity>
         </View>
         {isSuccess && <Text style={[styles.successText, { color: themeColors.green }]}>{t("resetLinkSent")}</Text>}
         {error && <Text style={[styles.errorText, { color: themeColors.red }]}>{error}</Text>}
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      padding: 20,
   },
   headerSection: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
      marginTop: 10,
      paddingLeft: 200,
   },
   headerButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
   },
   headerButton: {
      padding: 4,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
   },
   languageText: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.5,
   },
   logoSection: {
      alignItems: "center",
   },
   logoContainer: {
      alignItems: "center",
      justifyContent: "center",
      gap: 0,
   },
   forgotPasswordGreetingText: {
      fontSize: 24,
      textAlign: "center",
      marginTop: 30,
      fontWeight: "regular",
   },
   forgotPasswordSection: {
      alignItems: "center",
   },
   forgotPasswordBox: {
      width: 320,
      height: 280,
      borderWidth: 1,
      borderRadius: 10,
      marginTop: 40,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
   },
   forgotPasswordBoxTitle: {
      fontSize: 24,
      padding: 20,
   },
   forgotPasswordDescriptionText: {
      fontSize: 14,
      textAlign: "left",
      fontWeight: "regular",
      opacity: 0.6,
      marginBottom: 20,
      paddingHorizontal: 20,
      width: "100%",
      flexWrap: "wrap",
   },
   forgotPasswordInputSection: {
      width: "100%",
      paddingHorizontal: 20,
      gap: 16,
   },
   inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 25,
      paddingHorizontal: 16,
      height: 48,
   },
   verticalSeparator: {
      height: "50%",
      width: 1,
      marginHorizontal: 12,
   },
   input: {
      flex: 1,
      height: "100%",
      fontSize: 16,
      borderWidth: 0,
   },
   forgotPasswordButton: {
      width: 140,
      height: 48,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 90,
      marginTop: 20,
   },
   forgotPasswordButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "regular",
   },
   forgotPasswordPageFooter: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
   },
   forgotPasswordPageFooterText: {
      fontSize: 16,
      fontWeight: "regular",
      color: "#000",
   },
   errorText: {
      textAlign: "center",
      marginTop: 10,
      fontSize: 14,
      marginHorizontal: 20,
   },
   successText: {
      textAlign: "center",
      marginTop: 10,
      fontSize: 14,
      marginHorizontal: 20,
   },
});

export default ForgotPasswordScreen;
