import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { getThemeColors } from "../utils/getThemeColors";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import SideDrawer from "../../components/SideDrawer";
import { getUserId, getCurrentUser, updateUserProfile } from "../services/api";

interface ChangeCredentialsProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

interface UserInfo {
   firstName: string;
   lastName: string;
   email: string;
}

const ChangeCredentials: React.FC<ChangeCredentialsProps> = ({ isDarkMode, navigation }) => {
   const { t } = useTranslation();
   const themeColors = getThemeColors(isDarkMode);

   const [firstName, setFirstName] = useState("");
   const [lastName, setLastName] = useState("");
   const [email, setEmail] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [isSuccess, setIsSuccess] = useState(false);

   useEffect(() => {
      // Fetch current user info when component mounts
      fetchUserInfo();
   }, []);

   const fetchUserInfo = async () => {
      try {
         setIsLoading(true);
         const userInfo = await getCurrentUser();

         if (userInfo) {
            setFirstName(userInfo.firstName || "");
            setLastName(userInfo.lastName || "");
            setEmail(userInfo.email || "");
         }
      } catch (error: any) {
         console.error("Failed to fetch user info:", error);
         setError(t("profile.failedToLoadInfo"));
      } finally {
         setIsLoading(false);
      }
   };

   const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
   };

   const handleSubmit = async () => {
      // Reset states
      setError(null);
      setIsSuccess(false);

      // Field validation
      if (!firstName || !lastName || !email) {
         setError(t("profile.allFieldsRequired"));
         return;
      }

      // Email validation
      if (!validateEmail(email)) {
         setError(t("profile.invalidEmail"));
         return;
      }

      setIsSubmitting(true);

      try {
         // Get user ID
         const userId = await getUserId();

         // Match the exact structure that updateUserProfile expects (UpdateUserCommand)
         await updateUserProfile({
            firstName,
            lastName,
            // avatarUrl: null, // Optional
         });

         setIsSuccess(true);

         // Navigate back after a short delay
         setTimeout(() => {
            navigation.goBack();
         }, 1500);
      } catch (error: any) {
         console.error("Error updating profile:", error);
         setError(error.message || t("profile.failedToUpdate"));
         setIsSuccess(false);
      } finally {
         setIsSubmitting(false);
      }
   };

   function handleNavigate(screen: string): void {
      navigation.navigate(screen);
   }

   if (isLoading) {
      return (
         <View style={[styles.container, { backgroundColor: themeColors.page_background, justifyContent: "center", alignItems: "center" }]}>
            <ActivityIndicator size="large" color={themeColors.green} />
            <Text style={{ color: themeColors.card_title, marginTop: 20 }}>{t("common.loading")}</Text>
         </View>
      );
   }

   return (
      <View style={[styles.container, { backgroundColor: themeColors.page_background }]}>
         {/* Header */}
         <View style={styles.header}>
            <SideDrawer isDarkMode={isDarkMode} onNavigate={handleNavigate} currentRoute="changeProfile" />
         </View>

         <View style={styles.content}>
            {/* First Name */}
            <View style={styles.inputGroup}>
               <Text style={[styles.inputLabel, { color: themeColors.card_description }]}>{t("profile.firstName")}</Text>
               <TextInput
                  style={[
                     styles.input,
                     {
                        color: themeColors.card_title,
                        backgroundColor: themeColors.page_background,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  placeholder={t("profile.firstNamePlaceholder")}
                  placeholderTextColor={themeColors.card_description}
                  value={firstName}
                  onChangeText={(text) => {
                     setFirstName(text);
                     setError(null);
                  }}
               />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
               <Text style={[styles.inputLabel, { color: themeColors.card_description }]}>{t("profile.lastName")}</Text>
               <TextInput
                  style={[
                     styles.input,
                     {
                        color: themeColors.card_title,
                        backgroundColor: themeColors.page_background,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  placeholder={t("profile.lastNamePlaceholder")}
                  placeholderTextColor={themeColors.card_description}
                  value={lastName}
                  onChangeText={(text) => {
                     setLastName(text);
                     setError(null);
                  }}
               />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
               <Text style={[styles.inputLabel, { color: themeColors.card_description }]}>{t("profile.email")}</Text>
               <TextInput
                  style={[
                     styles.input,
                     {
                        color: themeColors.card_title,
                        backgroundColor: themeColors.page_background,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}
                  placeholder={t("profile.emailPlaceholder")}
                  placeholderTextColor={themeColors.card_description}
                  value={email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(text) => {
                     setEmail(text);
                     setError(null);
                  }}
               />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: themeColors.green }]} onPress={handleSubmit} disabled={isSubmitting}>
               {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
               ) : (
                  <Text style={styles.saveButtonText}>{t("profile.saveChanges")}</Text>
               )}
            </TouchableOpacity>

            {/* Error Message */}
            {error && <Text style={[styles.errorText, { color: themeColors.red }]}>{error}</Text>}

            {/* Success Message */}
            {isSuccess && <Text style={[styles.successText, { color: themeColors.green }]}>{t("profile.profileUpdated")}</Text>}
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
   content: {
      paddingHorizontal: 20,
      marginTop: 30,
   },
   screenTitle: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 24,
   },
   inputGroup: {
      marginBottom: 20,
   },
   inputLabel: {
      fontSize: 16,
      marginBottom: 8,
      fontWeight: "500",
   },
   input: {
      height: 50,
      width: "100%",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 16,
   },
   saveButton: {
      height: 50,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 24,
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

export default ChangeCredentials;
