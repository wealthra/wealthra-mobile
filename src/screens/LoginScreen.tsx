import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { LightMode } from "../assets/icons/LightMode";
import { DarkMode } from "../assets/icons/DarkMode";
import { LanguageIcon } from "../assets/icons/LanguageIcon";
import { SvgXml } from "react-native-svg";
import { data } from "../utils/data.js";
import { getThemeColors } from "../utils/getThemeColors";
import { loginUser } from "../services/api";
import { horizontalScale, verticalScale, moderateScale } from "../utils/scaling";

interface LoginScreenProps {
   isDarkMode: boolean; // Receive theme state
   onToggleTheme: () => void; // Receive toggle function
   navigation: any;
}

const LoginScreen = ({ isDarkMode, onToggleTheme, navigation }: LoginScreenProps) => {
   const { t, i18n } = useTranslation();
   const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
   const themeColors = getThemeColors(isDarkMode);
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Manual translation map as a fallback
   const translations: Record<"en" | "tr", { enterEmail: string; enterPassword: string }> = {
      en: {
         enterEmail: "Enter your email",
         enterPassword: "Enter your password",
      },
      tr: {
         enterEmail: "E-posta adresinizi girin",
         enterPassword: "Şifrenizi girin",
      },
   };

   // Initialize with correct language
   const [emailPlaceholder, setEmailPlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterEmail || "Enter your email");
   const [passwordPlaceholder, setPasswordPlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterPassword || "Enter your password");

   const toggleLanguage = () => {
      const newLang = i18n.language === "en" ? "tr" : "en";
      i18n.changeLanguage(newLang);
      setCurrentLanguage(newLang);

      // Manually update placeholders based on language
      setEmailPlaceholder(translations[newLang].enterEmail);
      setPasswordPlaceholder(translations[newLang].enterPassword);
   };

   // Get the opposite language to show in the button
   const buttonLanguage = currentLanguage === "en" ? "TR" : "EN";

   const handleLogin = async () => {
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

         // Validate password
         if (!password) {
            setError(t("passwordRequired"));
            return;
         }

         setIsLoading(true);
         setError(null);

         const response = await loginUser({ email, password });

         if (response && response.token) {
            console.log("Login successful, navigating to Dashboard");
            navigation.navigate("Dashboard");
         } else {
            throw new Error("Invalid response from server");
         }
      } catch (error: any) {
         console.error("Login error details:", {
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
            <Text style={[styles.loginGreetingText, { color: themeColors.card_title }]}>{t("loginGreeting")}</Text>
            <Text style={[styles.loginDescriptionText, { color: themeColors.card_title }]}>{t("loginDescription")}</Text>
         </View>
         <View style={styles.loginSection}>
            <View style={[styles.loginBox, { backgroundColor: themeColors.card_background, borderColor: themeColors.frame_stroke }]}>
               <Text style={[styles.loginBoxTitle, { color: themeColors.card_title }]}>{t("loginBoxTitle")}</Text>
               <View style={styles.loginInputSection}>
                  <View
                     style={[
                        styles.inputContainer,
                        { borderColor: themeColors.frame_stroke },
                        { backgroundColor: themeColors.text_input_background },
                     ]}>
                     <SvgXml xml={data[2].user ?? null} width={20} height={20} preserveAspectRatio="xMidYMid" />
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
                  <View
                     style={[
                        styles.inputContainer,
                        { borderColor: themeColors.frame_stroke },
                        { backgroundColor: themeColors.text_input_background },
                     ]}>
                     <SvgXml xml={data[3].password ?? null} width={20} height={20} preserveAspectRatio="xMidYMid" />
                     <View style={[styles.verticalSeparator, { backgroundColor: themeColors.frame_stroke }]} />
                     <TextInput
                        style={[styles.input, { color: themeColors.card_title }]}
                        placeholder={passwordPlaceholder}
                        placeholderTextColor={themeColors.card_title}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                     />
                  </View>
               </View>
               <TouchableOpacity
                  style={[styles.loginButton, { backgroundColor: themeColors.green }, isLoading && { opacity: 0.7 }]}
                  onPress={handleLogin}
                  disabled={isLoading}>
                  <Text style={styles.loginButtonText}>{isLoading ? t("loggingIn") : t("loginButtonText")}</Text>
               </TouchableOpacity>
            </View>
         </View>
         <View style={styles.loginPageFooter}>
            <Text style={[styles.loginPageFooterText, { color: themeColors.card_title }]}>{t("forgotYourPassword")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
               <Text style={[styles.loginPageFooterText, { color: themeColors.blue }]}>{t("resetPassword")}</Text>
            </TouchableOpacity>
         </View>
         {error && <Text style={[styles.errorText, { color: themeColors.red }]}>{error}</Text>}
      </View>
   );
};

export default LoginScreen;

const styles = StyleSheet.create({
   container: {
      flex: 1,
      padding: horizontalScale(20),
   },
   headerSection: {
      flexDirection: "row", // Example: Place title and button side-by-side
      justifyContent: "center",
      alignItems: "center",
      marginBottom: verticalScale(10), // Add some space below the header
      marginTop: verticalScale(10),
      paddingLeft: horizontalScale(200),
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
      gap: 8, // Add gap between icon and text
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
   loginGreetingText: {
      fontSize: moderateScale(24),
      textAlign: "center",
      marginTop: verticalScale(30),
      fontWeight: "regular",
   },
   loginDescriptionText: {
      fontSize: moderateScale(14),
      textAlign: "center",
      marginTop: verticalScale(10),
      fontWeight: "regular",
      opacity: 0.6,
   },
   loginSection: {
      alignItems: "center",
   },
   loginBox: {
      width: horizontalScale(320),
      height: verticalScale(280),
      borderWidth: 1,
      borderRadius: moderateScale(10),
      marginTop: verticalScale(40),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: verticalScale(2) },
      shadowOpacity: 0.25,
      shadowRadius: moderateScale(3.84),
      elevation: 5,
   },
   loginBoxTitle: {
      fontSize: moderateScale(24),
      padding: moderateScale(20),
   },
   loginInputSection: {
      width: "100%",
      paddingHorizontal: horizontalScale(20),
      gap: verticalScale(16),
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
   loginButton: {
      width: horizontalScale(130),
      height: verticalScale(48),
      borderRadius: moderateScale(10),
      justifyContent: "center",
      alignItems: "center",
      marginLeft: horizontalScale(90),
      marginTop: verticalScale(20),
   },
   loginButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "regular",
   },
   loginPageFooter: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
   },
   loginPageFooterText: {
      fontSize: 16,
      fontWeight: "regular",
      color: "#000",
   },
   emailInput: {
      width: "100%",
      height: 48,
      borderWidth: 1,
      borderRadius: 30,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
   },
   passwordInput: {
      width: "100%",
      height: 48,
      borderWidth: 1,
      borderRadius: 30,
      paddingHorizontal: 16,
   },
   seperator: {
      fontSize: 20,
      fontWeight: "regular",
      marginRight: 5,
      marginLeft: 5,
      borderWidth: 1,
      width: 1,
   },
   errorText: {
      textAlign: "center",
      marginTop: 10,
      fontSize: 14,
      marginHorizontal: 20,
   },
});
