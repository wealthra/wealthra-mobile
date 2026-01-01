// d:\Wealthra\mobile\src\screens\LandingScreen.tsx
import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from "react-native";
import { getThemeColors } from "../utils/getThemeColors";
import fonts from "../fonts";
import Carousel from "../../components/Carousel";
import { LightMode } from "../assets/icons/LightMode";
import { DarkMode } from "../assets/icons/DarkMode";
import { LanguageIcon } from "../assets/icons/LanguageIcon";
import { useTranslation } from "react-i18next";
import { SvgXml } from "react-native-svg";
import { data } from "../utils/data.js";

interface LandingScreenProps {
   isDarkMode: boolean; // Receive theme state
   onToggleTheme: () => void; // Receive toggle function
   navigation: any;
}

function LandingScreen({ isDarkMode, onToggleTheme, navigation }: LandingScreenProps) {
   const { t, i18n } = useTranslation();
   const themeColors = getThemeColors(isDarkMode);

   const toggleLanguage = () => {
      const newLang = i18n.language === "en" ? "tr" : "en";
      i18n.changeLanguage(newLang);
   };

   // Get the opposite language to show in the button
   const buttonLanguage = i18n.language === "en" ? "TR" : "EN";

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
               <SvgXml xml={data[0].logo ?? null} width={70} height={70} preserveAspectRatio="xMidYMid" style={{ marginBottom: -30 }} />
               <SvgXml xml={data[1].logotext ?? null} width={100} height={100} preserveAspectRatio="xMidYMid" style={{ marginBottom: -30 }} />
            </View>
            <Text style={[styles.underLogoText, { color: themeColors.card_title }]}>{t("underLogoText")}</Text>
         </View>
         <View style={styles.carouselSection}>
            <Carousel isDarkMode={isDarkMode} />
         </View>
         <View style={styles.features}>
            <Text style={[styles.featuresHeader, { color: themeColors.card_title }]}>{t("featuresHeader")}</Text>
            <View style={styles.featureCards}>
               <View
                  style={[
                     styles.featureCard,
                     {
                        backgroundColor: themeColors.page_background,
                        borderWidth: 1,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}>
                  <View style={styles.cardContent}>
                     <View style={[styles.circle, { backgroundColor: themeColors.yellow }]}>
                        <Text style={styles.circleText}>$</Text>
                     </View>
                     <View style={styles.textContent}>
                        <View style={styles.titleWrapper}>
                           <Text style={[styles.featureTitle, { color: themeColors.card_title }]}>{t("features.card1.firstPart")}</Text>
                           <Text style={[styles.featureTitle, { color: themeColors.yellow }]}>{t("features.card1.highlightedPart")}</Text>
                        </View>
                        <Text style={[styles.featureDescription, { color: themeColors.card_description }]}>{t("features.card1.description")}</Text>
                     </View>
                  </View>
               </View>

               <View
                  style={[
                     styles.featureCard,
                     {
                        backgroundColor: themeColors.page_background,
                        borderWidth: 1,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}>
                  <View style={styles.cardContent}>
                     <View style={[styles.circle, { backgroundColor: themeColors.green }]}>
                        <Text style={styles.circleText}>%</Text>
                     </View>
                     <View style={styles.textContent}>
                        <View style={styles.titleWrapper}>
                           <Text style={[styles.featureTitle, { color: themeColors.card_title }]}>{t("features.card2.firstPart")}</Text>
                           <Text style={[styles.featureTitle, { color: themeColors.green }]}>{t("features.card2.highlightedPart")}</Text>
                        </View>
                        <Text style={[styles.featureDescription, { color: themeColors.card_description }]}>{t("features.card2.description")}</Text>
                     </View>
                  </View>
               </View>
            </View>
         </View>
         <TouchableOpacity style={[styles.signUpButton, { backgroundColor: themeColors.green }]} onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.signUpButtonText}>{t("signUpText")}</Text>
         </TouchableOpacity>
         <View style={styles.loginContainer}>
            <Text style={[styles.tagline, { color: themeColors.card_title }]}>{t("alreadyUser")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
               <Text style={[styles.tagline, { color: themeColors.blue }]}>{t("login")}</Text>
            </TouchableOpacity>
         </View>
         <Text style={[styles.tagline, { color: themeColors.card_text }]}>{t("tagline")}</Text>
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      padding: 20,
   },
   headerSection: {
      flexDirection: "row", // Example: Place title and button side-by-side
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10, // Add some space below the header
      marginTop: 10,
      paddingLeft: 200,
   },
   tagline: {
      fontSize: 16,
      textAlign: "center",
      marginTop: 10,
   },
   themeToggleButton: {
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
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
   underLogoText: {
      fontSize: 16,
      textAlign: "center",
      marginTop: -5,
   },
   carouselSection: {
      alignItems: "center",
      marginBottom: -25,
      marginTop: -15,
   },
   features: {
      marginBottom: 10,
   },
   featuresHeader: {
      fontSize: 24,
      fontWeight: "bold",
   },
   featureCards: {
      marginTop: 16,
      gap: 16,
   },
   featureCard: {
      height: 120, // Fixed height instead of minHeight
      borderRadius: 15,
      padding: 20,
      justifyContent: "center",
      overflow: "hidden", // Hide overflowing content
   },
   cardContent: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 16,
      height: "100%", // Fill the card height
   },
   circle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 15,
   },
   textContent: {
      flex: 1,
      flexShrink: 1,
      overflow: "hidden", // Hide overflowing text
      marginTop: -10,
   },
   titleWrapper: {
      flexDirection: "column",
      marginBottom: 4, // Reduced margin
      flexWrap: "wrap",
   },
   featureTitle: {
      fontSize: 16, // Slightly smaller font
      fontWeight: "bold",
      lineHeight: 20,
      flexWrap: "wrap",
   },
   featureDescription: {
      fontSize: 13, // Slightly smaller font
      lineHeight: 16,
      flexWrap: "wrap",
   },
   circleText: {
      fontWeight: "bold",
      fontSize: 20,
   },
   signUpButton: {
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      width: 200,
      marginLeft: 70,
   },
   signUpButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "regular",
   },
   loginContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 40,
   },
});

export default LandingScreen;
