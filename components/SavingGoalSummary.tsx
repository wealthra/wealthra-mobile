import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";
import { usePrivacy } from "../src/context/PrivacyContext";
import { getCurrencySymbol } from "../src/utils/currencyUtils";

interface SavingGoalSummaryProps {
   currentAmount: number;
   targetAmount: number;
   isDarkMode: boolean;
   currency?: string;
}

const { width: windowWidth } = Dimensions.get("window");

const SavingGoalSummary: React.FC<SavingGoalSummaryProps> = ({ currentAmount, targetAmount, isDarkMode, currency }) => {
   const { isPrivacyMode } = usePrivacy();
   const themeColors = getThemeColors(isDarkMode);
   const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
   const progressPercentage = Math.min(100, Math.round(progress)); // Cap at 100%
   const { t } = useTranslation();

   const formatAmount = (amount: number) => {
      const symbol = getCurrencySymbol(currency);
      return isPrivacyMode ? "****" : `${symbol}${amount.toLocaleString()}`;
   };

   return (
      <View
         style={[
            styles.container,
            {
               backgroundColor: themeColors.card_background,
               borderColor: isDarkMode ? themeColors.frame_stroke : "#E0E0E0",
            },
         ]}>
         <Text style={[styles.percentageText, { color: isDarkMode ? themeColors.blue : "#47B5FF" }]}>{progressPercentage}%</Text>
         <Text style={[styles.titleText, { color: isDarkMode ? themeColors.card_title : "#333333" }]}>{t("totalSavingProgress")}</Text>
         <Text style={styles.subtitleText}>{t("overallProgress")}</Text>
         <Text style={styles.amountText}>
            <Text style={[styles.currentAmount, { color: isDarkMode ? themeColors.card_description : "#333333" }]}>
               {formatAmount(currentAmount)}
            </Text>
            <Text style={styles.separator}> / </Text>
            <Text style={styles.targetAmount}>{formatAmount(targetAmount)}</Text>
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
      borderRadius: moderateScale(15),
      padding: moderateScale(10),
      borderWidth: 1,
      width: windowWidth * 0.85,
      maxWidth: horizontalScale(340),
      height: verticalScale(154),
   },
   percentageText: {
      fontSize: moderateScale(28),
   },
   titleText: {
      fontSize: moderateScale(20),
   },
   subtitleText: {
      fontSize: moderateScale(18),
      color: "#999999", // This stays constant
   },
   amountText: {
      fontSize: moderateScale(20),
   },
   currentAmount: {},
   separator: {
      color: "#999999", // This stays constant
   },
   targetAmount: {
      color: "#999999", // This stays constant
   },
   progressBarContainer: {
      height: verticalScale(10),
      borderRadius: moderateScale(4),
      overflow: "hidden",
      marginTop: verticalScale(8),
   },
   progressBar: {
      height: "100%",
      borderRadius: moderateScale(4),
   },
});

export default SavingGoalSummary;
