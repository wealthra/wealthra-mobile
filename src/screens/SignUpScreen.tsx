import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { LightMode } from "../assets/icons/LightMode";
import { DarkMode } from "../assets/icons/DarkMode";
import { LanguageIcon } from "../assets/icons/LanguageIcon";
import { SvgXml } from "react-native-svg";
import { data } from "../utils/data.js";
import { getThemeColors } from "../utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { signUp } from "../services/api";
import { horizontalScale, verticalScale, moderateScale } from "../utils/scaling";

interface SignUpScreenProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

const SignUpScreen = ({ isDarkMode, onToggleTheme, navigation }: SignUpScreenProps) => {
   const { t, i18n } = useTranslation();
   const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
   const themeColors = getThemeColors(isDarkMode);
   const [email, setEmail] = useState("");
   const [firstName, setFirstName] = useState("");
   const [surname, setSurname] = useState("");
   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isSuccess, setIsSuccess] = useState(false);

   // Manual translation map as a fallback
   const translations: Record<
      "en" | "tr",
      { enterEmail: string; enterFirstName: string; enterSurname: string; enterPassword: string; enterConfirmPassword: string }
   > = {
      en: {
         enterEmail: "Enter your email",
         enterFirstName: "Enter your first name",
         enterSurname: "Enter your surname",
         enterPassword: "Enter your password",
         enterConfirmPassword: "Confirm your password",
      },
      tr: {
         enterEmail: "E-posta adresinizi girin",
         enterFirstName: "Adınızı girin",
         enterSurname: "Soyadınızı girin",
         enterPassword: "Şifrenizi girin",
         enterConfirmPassword: "Şifrenizi onaylayın",
      },
   };
   // Initialize with correct language
   const [emailPlaceholder, setEmailPlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterEmail || "Enter your email");
   const [firsNamePlaceholder, setFirstNamePlaceholder] = useState(
      translations[i18n.language as "en" | "tr"].enterFirstName || "Enter your first name"
   );
   const [surnamePlaceholder, setSurnamePlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterSurname || "Enter your surname");
   const [passwordPlaceholder, setPasswordPlaceholder] = useState(translations[i18n.language as "en" | "tr"].enterPassword || "Enter your password");
   const [confirmPasswordPlaceholder, setConfirmPasswordPlaceholder] = useState(
      translations[i18n.language as "en" | "tr"].enterConfirmPassword || "Confirm your password"
   );

   const toggleLanguage = () => {
      const newLang = i18n.language === "en" ? "tr" : "en";
      i18n.changeLanguage(newLang);
      setCurrentLanguage(newLang);
      setEmailPlaceholder(translations[newLang].enterEmail);
      setFirstNamePlaceholder(translations[newLang].enterFirstName);
      setSurnamePlaceholder(translations[newLang].enterSurname);
      setPasswordPlaceholder(translations[newLang].enterPassword);
      setConfirmPasswordPlaceholder(translations[newLang].enterConfirmPassword);
   };

   const buttonLanguage = currentLanguage === "en" ? "TR" : "EN";

   const handleSignUp = async () => {
      try {
         // All form validation checks remain the same
         if (!firstName.trim()) {
            setError(t("firstNameRequired"));
            return;
         }

         if (!surname.trim()) {
            setError(t("lastNameRequired"));
            return;
         }

         if (!email) {
            setError(t("emailRequired"));
            return;
         }

         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email)) {
            setError(t("invalidEmailFormat"));
            return;
         }

         if (!password) {
            setError(t("passwordRequired"));
            return;
         }

         if (password.length < 12) {
            setError(t("passwordTooShort"));
            return;
         }

         const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
         const hasCapitalLetter = /[A-Z]/.test(password);
         const hasNumber = /[0-9]/.test(password);

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

         if (!confirmPassword) {
            setError(t("confirmPasswordRequired"));
            return;
         }

         if (password !== confirmPassword) {
            setError(t("passwordsDoNotMatch"));
            return;
         }

         setIsLoading(true);
         setError(null);
         setIsSuccess(false);

         // Call the API
         const response = await signUp(firstName, surname, email, password);

         // Handle the API response
         if (response && response.email) {
            // Successful registration
            setIsSuccess(true);
            setFirstName("");
            setSurname("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setError(null);
            navigation.navigate("Login");
         } else {
            // The API returned null - handle gracefully without throwing
            // This is likely the already registered email case
            setError(t("emailAlreadyRegistered")); // Make sure you have this translation key
            setIsLoading(false);
            return;
         }
      } catch (error: any) {
         // This will only execute if there's an unexpected error not handled by the API
         console.error("Sign Up error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
         });

         // Handle specific error cases
         if (error.response?.status === 400) {
            setError(t("emailAlreadyRegistered"));
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
            <Text style={[styles.signUpGreetingText, { color: themeColors.card_title }]}>{t("signUpGreetingText")}</Text>
         </View>
         <View style={styles.signUpSection}>
            <View style={[styles.signUpBox, { backgroundColor: themeColors.card_background, borderColor: themeColors.frame_stroke }]}>
               <Text style={[styles.signUpBoxTitle, { color: themeColors.card_title }]}>{t("signUpTitle")}</Text>
               <View style={styles.signUpInputSection}>
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
                        placeholder={firsNamePlaceholder}
                        placeholderTextColor={themeColors.card_title}
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                     />
                  </View>
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
                        placeholder={surnamePlaceholder}
                        placeholderTextColor={themeColors.card_title}
                        value={surname}
                        onChangeText={setSurname}
                        autoCapitalize="words"
                     />
                  </View>
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
                        autoCapitalize="none"
                        secureTextEntry
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
                        placeholder={confirmPasswordPlaceholder}
                        placeholderTextColor={themeColors.card_title}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        autoCapitalize="none"
                        secureTextEntry
                     />
                  </View>
               </View>
               <TouchableOpacity
                  style={[styles.signUpButton, { backgroundColor: themeColors.green }, isLoading && { opacity: 0.7 }]}
                  onPress={handleSignUp}
                  disabled={isLoading}>
                  <Text style={styles.signUpButtonText}>{isLoading ? t("loggingIn") : t("signUpButtonText")}</Text>
               </TouchableOpacity>
            </View>
            <View style={styles.signUpPageFooter}>
               <Text style={[styles.signUpPageFooterText, { color: themeColors.card_title }]}>{t("alreadyUser")}</Text>
               <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={[styles.signUpPageFooterText, { color: themeColors.blue }]}>{t("login")}</Text>
               </TouchableOpacity>
            </View>
         </View>
         {isSuccess && <Text style={[styles.successText, { color: themeColors.green }]}>{t("confirmEmail")}</Text>}
         {error && <Text style={[styles.errorText, { color: themeColors.red }]}>{error}</Text>}
      </View>
   );
};

export default SignUpScreen;

const styles = StyleSheet.create({
   container: {
      flex: 1,
      padding: horizontalScale(20),
   },
   headerSection: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: verticalScale(10),
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
   signUpGreetingText: {
      fontSize: 24,
      textAlign: "center",
      marginTop: 30,
      fontWeight: "regular",
   },
   signUpSection: {
      alignItems: "center",
   },
   signUpBox: {
      width: horizontalScale(320),
      height: verticalScale(480),
      borderWidth: 1,
      borderRadius: moderateScale(10),
      marginTop: verticalScale(20),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: verticalScale(2) },
      shadowOpacity: 0.25,
      shadowRadius: moderateScale(3.84),
      elevation: 5,
   },
   signUpBoxTitle: {
      fontSize: moderateScale(24),
      padding: moderateScale(20),
   },
   signUpInputSection: {
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
   signUpButton: {
      width: horizontalScale(140),
      height: verticalScale(48),
      borderRadius: moderateScale(10),
      justifyContent: "center",
      alignItems: "center",
      marginLeft: horizontalScale(90),
      marginTop: verticalScale(20),
   },
   signUpButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "regular",
   },
   signUpPageFooter: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
   },
   signUpPageFooterText: {
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
