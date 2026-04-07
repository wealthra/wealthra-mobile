import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import DashboardCarousel from "./DashboardCarousel"; // Importing the new component
import SavingGoalSummary from "./SavingGoalSummary"; // Importing the new component
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";

interface SpendingData {
   name: string;
   amount: number;
   color: string;
}

interface SpendingChartProps {
   isDarkMode: boolean;
   data: SpendingData[];
}
const { width: windowWidth } = Dimensions.get("window");

const SpendingChart: React.FC<SpendingChartProps> = ({ isDarkMode, data }) => {
   const themeColors = getThemeColors(isDarkMode);
   const screenWidth = Dimensions.get("window").width;
   const chartWidth = screenWidth - horizontalScale(40);
   const chartHeight = verticalScale(180);
   const { t } = useTranslation();

   const chartConfig = {
      backgroundGradientFrom: themeColors.card_background,
      backgroundGradientTo: themeColors.card_background,
      color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
   };

   const chartData = data.map((item) => ({
      name: item.name,
      population: item.amount,
      color: item.color,
      legendFontColor: isDarkMode ? themeColors.card_title : themeColors.card_title,
      legendFontSize: moderateScale(12),
   }));

   return (
      <View
         style={[
            styles.container,
            {
               backgroundColor: themeColors.card_background,
               borderColor: isDarkMode ? themeColors.frame_stroke : "#E0E0E0",
            },
         ]}>
         <Text style={[styles.title, { color: themeColors.card_title }]}>{t("spendingsDonutChartTitle")}</Text>
         <View style={styles.chartWrapper}>
            <PieChart
               data={chartData}
               width={chartWidth}
               height={chartHeight}
               chartConfig={{
                  ...chartConfig,
                  backgroundGradientFrom: themeColors.card_background,
                  backgroundGradientTo: themeColors.card_background,
               }}
               accessor="population"
               backgroundColor="transparent"
               paddingLeft={horizontalScale(-88).toString()}
               absolute
               center={[chartWidth / 2, 0]}
               hasLegend={false} // Disable built-in legend
            />
         </View>
         {/* Custom legend */}
         <View style={styles.legendContainer}>
            {data.map((item, index) => (
               <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: themeColors.card_title }]}>{t(`categories.${item.name.toLowerCase().replace(/\s+/g, "_")}`)}</Text>
               </View>
            ))}
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      width: windowWidth * 0.85,
      alignItems: "center",
      borderWidth: 1,
      borderRadius: moderateScale(15),
      marginTop: verticalScale(20),
   },
   title: {
      fontSize: moderateScale(24),
      marginTop: verticalScale(5),
   },
   chartWrapper: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
   },
   legendContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      marginTop: verticalScale(10), // Added top margin
      paddingHorizontal: horizontalScale(10), // Added horizontal padding
      marginBottom: verticalScale(15),
   },
   legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: horizontalScale(15), // Matches AnalyticsScreen marginRight
      marginBottom: verticalScale(8), // Breathable vertical space
   },
   legendDot: {
      width: horizontalScale(12), // Slightly larger dots for clarity
      height: horizontalScale(12),
      borderRadius: horizontalScale(6),
      marginRight: horizontalScale(8),
   },
   legendText: {
      fontSize: moderateScale(13), // Slightly larger text for legibility
   },
});

export default SpendingChart;
