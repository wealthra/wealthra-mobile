import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { getThemeColors } from "../utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import SideDrawer from "../../components/SideDrawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n/config";

interface SettingsScreenProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

// Setting item component for reusability
interface SettingItemProps {
   title: string;
   onPress: () => void;
   color?: string;
   showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ title, onPress, color = undefined, showChevron = true }) => {
   const { isDarkMode } = React.useContext(ThemeContext);
   const themeColors = getThemeColors(isDarkMode);

   return (
      <TouchableOpacity style={styles.settingItem} onPress={onPress}>
         <Text style={[styles.settingText, { color: color || themeColors.card_title }]}>{title}</Text>
         {showChevron && <Ionicons name="chevron-forward" size={24} color={themeColors.card_description} />}
      </TouchableOpacity>
   );
};

// Context for theme to avoid prop drilling
const ThemeContext = React.createContext({ isDarkMode: false });

const SettingsScreen: React.FC<SettingsScreenProps> = ({ isDarkMode, onToggleTheme, navigation }) => {
   const { t } = useTranslation();
   const themeColors = getThemeColors(isDarkMode);

   function handleNavigate(screen: string): void {
      navigation.navigate(screen);
   }

   // Handle language change with useState for re-render
   const [, forceUpdate] = React.useState(0);
   const changeLanguage = () => {
      // Change language
      const newLanguage = i18n.language === "en" ? "tr" : "en";

      // Save language preference to AsyncStorage
      AsyncStorage.setItem("userLanguage", newLanguage).catch((error) => console.error("Error saving language preference:", error));

      // Change the language in i18n
      i18n.changeLanguage(newLanguage);

      // Force re-render by updating state
      forceUpdate((prev) => prev + 1);

      // Short delay before showing alert (to allow re-render to complete)
      setTimeout(() => {}, 100);
   };

   // Handle theme toggle
   const toggleTheme = () => {
      onToggleTheme();
   };

   // Handle logout
   const handleLogout = () => {
      Alert.alert(t("settings.logoutTitle"), t("settings.logoutMessage"), [
         { text: t("settings.logoutCancel"), style: "cancel" },
         {
            text: t("settings.logout"),
            style: "destructive",
            onPress: async () => {
               try {
                  // Clear token and navigate to login
                  await AsyncStorage.removeItem("userToken");
                  navigation.reset({
                     index: 0,
                     routes: [{ name: "Login" }],
                  });
               } catch (error) {
                  console.error("Error during logout:", error);
                  Alert.alert(t("alerts.titles.error"), t("settings.logoutError"));
               }
            },
         },
      ]);
   };

   return (
      <ThemeContext.Provider value={{ isDarkMode }}>
         <View style={[styles.container, { backgroundColor: themeColors.page_background }]}>
            <View style={styles.headerSection}>
               <SideDrawer isDarkMode={isDarkMode} onNavigate={handleNavigate} currentRoute="Settings" />
            </View>

            <ScrollView style={styles.scrollView}>
               {/* Profile Settings Section */}
               <View style={[styles.section, { backgroundColor: themeColors.page_background, borderColor: themeColors.frame_stroke }]}>
                  <Text style={[styles.sectionTitle, { color: themeColors.card_description }]}>{t("settings.profileSettings")}</Text>

                  <SettingItem title={t("settings.credentials")} onPress={() => navigation.navigate("changeCredentials")} />

                  <SettingItem title={t("settings.changePassword")} onPress={() => navigation.navigate("changePassword")} />
               </View>

               {/* Application Settings Section */}
               <View style={[styles.section, { backgroundColor: themeColors.page_background, borderColor: themeColors.frame_stroke }]}>
                  <Text style={[styles.sectionTitle, { color: themeColors.card_description }]}>{t("settings.applicationSettings")}</Text>

                  <SettingItem title={t("settings.changeLanguage")} onPress={changeLanguage} />

                  <SettingItem title={t("settings.changeTheme")} onPress={toggleTheme} />
               </View>

               {/* Session & Account Section */}
               <View style={[styles.section, { backgroundColor: themeColors.page_background, borderColor: themeColors.frame_stroke }]}>
                  <Text style={[styles.sectionTitle, { color: themeColors.card_description }]}>{t("settings.sessionAccount")}</Text>

                  <SettingItem title={t("settings.logout")} onPress={handleLogout} color={themeColors.red} />
               </View>
            </ScrollView>
         </View>
      </ThemeContext.Provider>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   headerSection: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      paddingHorizontal: 10,
      paddingVertical: 20,
      marginTop: 30,
   },
   scrollView: {
      flex: 1,
      paddingHorizontal: 20,
      marginTop: 20,
   },
   section: {
      borderRadius: 15,
      borderWidth: 1,
      padding: 16,
      marginBottom: 20,
   },
   sectionTitle: {
      fontSize: 24,
      fontWeight: "500",
      marginBottom: 16,
   },
   settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
   },
   settingText: {
      fontSize: 18,
   },
});

export default SettingsScreen;
