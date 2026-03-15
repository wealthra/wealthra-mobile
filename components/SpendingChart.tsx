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
            <View style={styles.centerCircle}>
               <View style={[styles.innerCircle, { backgroundColor: themeColors.card_background }]} />
            </View>
         </View>
         {/* Custom legend */}
         <View style={styles.legendContainer}>
            {data.map((item, index) => (
               <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: themeColors.card_title }]}>{t(`categories.${item.name.toLowerCase()}`)}</Text>
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
   centerCircle: {
      position: "absolute",
      left: "50%", // Aligns with the pie chart center
      top: "50%",
      transform: [{ translateX: horizontalScale(-35) }, { translateY: verticalScale(-35) }],
      width: horizontalScale(70),
      height: horizontalScale(70),
      borderRadius: horizontalScale(35),
      alignItems: "center",
      justifyContent: "center",
   },
   innerCircle: {
      width: horizontalScale(100),
      height: horizontalScale(100),
      borderRadius: horizontalScale(50),
      marginLeft: horizontalScale(20),
   },
   legendContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: horizontalScale(10),
      marginBottom: verticalScale(10),
   },
   legendItem: {
      flexDirection: "row",
      alignItems: "center",
   },
   legendDot: {
      width: horizontalScale(10),
      height: horizontalScale(10),
      borderRadius: horizontalScale(5),
      marginRight: horizontalScale(5),
   },
   legendText: {
      fontSize: moderateScale(12),
   },
});

export default SpendingChart;
