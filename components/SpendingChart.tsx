import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import DashboardCarousel from "./DashboardCarousel"; // Importing the new component
import SavingGoalSummary from "./SavingGoalSummary"; // Importing the new component

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
   const chartWidth = screenWidth - 40;
   const chartHeight = 180;
   const { t } = useTranslation();

   const chartConfig = {
      backgroundGradientFrom: isDarkMode ? "#1E1E1E" : "#FFFFFF",
      backgroundGradientTo: isDarkMode ? "#1E1E1E" : "#FFFFFF",
      color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
   };

   const chartData = data.map((item) => ({
      name: item.name,
      population: item.amount,
      color: item.color,
      legendFontColor: isDarkMode ? themeColors.card_title : themeColors.card_title,
      legendFontSize: 12,
   }));

   return (
      <View
         style={[
            styles.container,
            {
               backgroundColor: isDarkMode ? themeColors.page_background : "#FFFFFF",
               borderColor: isDarkMode ? themeColors.frame_stroke : "#E0E0E0",
            },
         ]}>
         <Text style={[styles.title, { color: themeColors.card_title }]}>{t("spendingsDonutChartTitle")}</Text>
         <View style={styles.chartWrapper}>
            <PieChart
               data={chartData}
               width={chartWidth}
               height={chartHeight}
               chartConfig={chartConfig}
               accessor="population"
               backgroundColor="transparent"
               paddingLeft="-88"
               absolute
               center={[chartWidth / 2, 0]}
               hasLegend={false} // Disable built-in legend
            />
            <View style={styles.centerCircle}>
               <View style={[styles.innerCircle, { backgroundColor: isDarkMode ? themeColors.page_background : themeColors.page_background }]} />
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
      borderRadius: 15,
      marginTop: 20,
   },
   title: {
      fontSize: 24,
      marginTop: 5,
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
      transform: [{ translateX: -35 }, { translateY: -35 }],
      width: 70,
      height: 70,
      borderRadius: 35,
      alignItems: "center",
      justifyContent: "center",
   },
   innerCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginLeft: 20,
   },
   legendContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
      marginBottom: 10,
   },
   legendItem: {
      flexDirection: "row",
      alignItems: "center",
   },
   legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 5,
   },
   legendText: {
      fontSize: 12,
   },
});

export default SpendingChart;
