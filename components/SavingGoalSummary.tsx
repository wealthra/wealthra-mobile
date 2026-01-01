import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";

interface SavingGoalSummaryProps {
   currentAmount: number;
   targetAmount: number;
   isDarkMode: boolean;
}

const { width: windowWidth } = Dimensions.get("window");

const SavingGoalSummary: React.FC<SavingGoalSummaryProps> = ({ currentAmount, targetAmount, isDarkMode }) => {
   const themeColors = getThemeColors(isDarkMode);
   const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
   const progressPercentage = Math.min(100, Math.round(progress)); // Cap at 100%
   const { t } = useTranslation();

   return (
      <View
         style={[
            styles.container,
            {
               backgroundColor: isDarkMode ? themeColors.page_background : "#FFFFFF",
               borderColor: isDarkMode ? themeColors.frame_stroke : "#E0E0E0",
            },
         ]}>
         <Text style={[styles.percentageText, { color: isDarkMode ? themeColors.blue : "#47B5FF" }]}>{progressPercentage}%</Text>
         <Text style={[styles.titleText, { color: isDarkMode ? themeColors.card_title : "#333333" }]}>{t("totalSavingProgress")}</Text>
         <Text style={styles.subtitleText}>{t("overallProgress")}</Text>
         <Text style={styles.amountText}>
            <Text style={[styles.currentAmount, { color: isDarkMode ? themeColors.card_description : "#333333" }]}>
               ${currentAmount.toLocaleString()}
            </Text>
            <Text style={styles.separator}> / </Text>
            <Text style={styles.targetAmount}>${targetAmount.toLocaleString()}</Text>
         </Text>
         <View style={[styles.progressBarContainer, { backgroundColor: isDarkMode ? themeColors.frame_stroke : "#F0F0F0" }]}>
            <LinearGradient
               colors={["#FF69B4", "#9370DB"]}
               start={{ x: 0, y: 0 }}
               end={{ x: 1, y: 0 }}
               style={[styles.progressBar, { width: `${progress}%` }]}
            />
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      borderRadius: 15,
      padding: 10,
      borderWidth: 1,
      width: windowWidth * 0.85,
      maxWidth: 340,
      height: 154,
   },
   percentageText: {
      fontSize: 28,
   },
   titleText: {
      fontSize: 20,
   },
   subtitleText: {
      fontSize: 18,
      color: "#999999", // This stays constant
   },
   amountText: {
      fontSize: 20,
   },
   currentAmount: {},
   separator: {
      color: "#999999", // This stays constant
   },
   targetAmount: {
      color: "#999999", // This stays constant
   },
   progressBarContainer: {
      height: 10,
      borderRadius: 4,
      overflow: "hidden",
      marginTop: 8,
   },
   progressBar: {
      height: "100%",
      borderRadius: 4,
   },
});

export default SavingGoalSummary;
