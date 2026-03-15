import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getThemeColors } from "../utils/getThemeColors";
import { useTranslation } from "react-i18next";
import {
   getSpendingBreakdown,
   getMonthlyTrends,
   getMonthlyMetrics,
} from "../services/api";
import SideDrawer from "../../components/SideDrawer";
import { BarChart, LineChart } from "react-native-gifted-charts";
import DateTimePicker from "@react-native-community/datetimepicker";
import { horizontalScale, verticalScale, moderateScale } from "../utils/scaling";

interface AnalyticsScreenProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

// Add this near the top of your file with other interfaces
interface BarChartDataItem {
   value: number;
   label?: string;
   frontColor?: string;
   spacing?: number;
   labelTextStyle?: any;
   showXAxisIndex?: boolean;
   rightLabelComponent?: () => React.ReactNode;
   leftShift?: number;
   barWidth?: number;
}

const screenWidth = Dimensions.get("window").width;

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ isDarkMode, navigation }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t } = useTranslation();
   const [isLoading, setIsLoading] = useState(false);
   const [expenseData, setExpenseData] = useState<any[]>([]);
   const [incomeData, setIncomeData] = useState<{ incomeByMonth: number[]; expenseByMonth: number[]; months: string[] }>({
      incomeByMonth: [],
      expenseByMonth: [],
      months: [],
   });
   const [monthlyExpenseData, setMonthlyExpenseData] = useState<{ months: string[]; expenseByMonth: number[] }>({
      months: [],
      expenseByMonth: [],
   });
   const [dateRange, setDateRange] = useState("month"); // "week", "month", "year"
   const [selectedDate, setSelectedDate] = useState(new Date());
   const [showDatePicker, setShowDatePicker] = useState(false);
   const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Default: 7 days ago
   const [endDate, setEndDate] = useState(new Date()); // Default: today
   const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);

   // Fetch data when component mounts or date range changes
   useEffect(() => {
      fetchAnalyticsData();
      fetchMetricsData();
   }, [startDate, endDate]); // Fetch data when date range changes

   const fetchMetricsData = async () => {
      try {
         const metrics = await getMonthlyMetrics(new Date().toISOString().split("T")[0]);
         console.log("Monthly metrics fetched:", metrics);
         // You can add state to display these metrics if needed
      } catch (error) {
         console.error("Error fetching metrics:", error);
      }
   };

   const fetchAnalyticsData = async () => {
      setIsLoading(true);
      try {
         // Fetch all data in parallel for better performance
         const [categoryResult, trendsResult] = await Promise.all([
            getSpendingBreakdown(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]),
            getMonthlyTrends(new Date().getFullYear()),
         ]);

         console.log("All API data fetched successfully");

         // Process category data
         if (categoryResult.categoryBreakdown && categoryResult.categoryBreakdown.length > 0) {
            // Use proper category colors instead of generic color array
            const mappedExpenseData = categoryResult.categoryBreakdown.map((item) => ({
               name: item.categoryName || "Other",
               value: item.amount,
               color: getCategoryColor(item.categoryName || "Other"), // Use category-specific color
               legendFontColor: themeColors.card_title,
               legendFontSize: 12,
            }));

            setExpenseData(mappedExpenseData);
         } else {
            setExpenseData([]);
         }

         // Process monthly data for the bar chart
         if (trendsResult.monthlyData && trendsResult.monthlyData.length > 0) {
            const monthsArray = trendsResult.monthlyData.map((item) => item.monthName || `Month ${item.month}`);
            const incomeArray = trendsResult.monthlyData.map((item) => item.totalIncome);
            const expenseArray = trendsResult.monthlyData.map((item) => item.totalExpenses);

            // Update state with the processed data
            setIncomeData({
               months: monthsArray,
               incomeByMonth: incomeArray,
               expenseByMonth: expenseArray,
            });
         } else {
            setIncomeData({
               months: [],
               incomeByMonth: [],
               expenseByMonth: [],
            });
         }

         console.log("Data processing complete");
      } catch (error) {
         console.error("Error fetching analytics data:", error);
      } finally {
         setIsLoading(false);
      }
   };

   const fetchCategorySpendingData = async () => {
      try {
         const result = await getSpendingBreakdown(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]);

         console.log("Category spending API response:", result);

         if (!result || !result.categoryBreakdown || result.categoryBreakdown.length === 0) {
            setExpenseData([]);
            return;
         }

         const categoryColors = ["#FFC107", "#4CAF50", "#2196F3", "#9C27B0", "#F44336", "#FF9800", "#009688", "#795548"];

         const mappedExpenseData = result.categoryBreakdown.map((item, index) => ({
            name: item.categoryName || "Other",
            value: item.amount,
            color: categoryColors[index % categoryColors.length],
         }));

         setExpenseData(mappedExpenseData);
      } catch (error) {
         console.error("Error fetching category spending data:", error);
         setExpenseData([]);
      }
   };

   const fetchMonthlyTrendsData = async () => {
      try {
         const result = await getMonthlyTrends(new Date().getFullYear());
         console.log("Monthly trends API response:", result);

         if (!result || !result.monthlyData) {
            setIncomeData({ months: [], incomeByMonth: [], expenseByMonth: [] });
            return;
         }

         const months = result.monthlyData.map((item) => item.monthName || `Month ${item.month}`);
         const incomeByMonth = result.monthlyData.map((item) => item.totalIncome);
         const expenseByMonth = result.monthlyData.map((item) => item.totalExpenses);

         setIncomeData({
            months: months,
            incomeByMonth: incomeByMonth,
            expenseByMonth: expenseByMonth,
         });
      } catch (error) {
         console.error("Error fetching monthly trends data:", error);
      }
   };

   const handleDateRangeChange = (range: string) => {
      setDateRange(range);
   };

   const handleNavigate = (screen: string) => {
      navigation.navigate(screen);
   };

   const onDateChange = (event: any, selectedDate: Date | undefined) => {
      const currentDate = selectedDate || new Date();
      setShowDatePicker(false);
      setSelectedDate(currentDate);
      // TODO: Fetch new data based on selected date
   };

   // Add this useEffect near your other hooks
   useEffect(() => {
      if (incomeData.months && incomeData.months.length > 0) {
         console.log("Bar Chart Month Labels:", incomeData.months);
      }
   }, [incomeData.months]);

   // Add this function to your AnalyticsScreen component
   const getCategoryColor = (categoryName: string): string => {
      const normalizedName = categoryName.toLowerCase();

      switch (normalizedName) {
         case "food":
            return themeColors.food_category;
         case "housing":
            return themeColors.housing_category;
         case "entertainment":
            return themeColors.entertainment_category;
         case "healthcare":
            return themeColors.health_category;
         case "education":
            return themeColors.education_category;
         case "transport":
            return themeColors.transport_category;
         case "shopping":
            return themeColors.shopping_category;
         default:
            return themeColors.other_category;
      }
   };

   return (
      <View style={[styles.container, { backgroundColor: themeColors.page_background }]}>
         {/* Header */}
         <View style={styles.header}>
            <SideDrawer isDarkMode={isDarkMode} onNavigate={handleNavigate} currentRoute="analytics" />
         </View>

         {/* Date Picker */}
         <View style={styles.datePickerContainer}>
            <TouchableOpacity
               style={[styles.datePickerButton, { backgroundColor: themeColors.page_background }, { borderColor: themeColors.frame_stroke }]}
               onPress={() => {
                  setIsSelectingStartDate(true); // Always start with selecting start date
                  setShowDatePicker(true);
               }}>
               <Text style={[styles.datePickerText, { color: themeColors.card_title }]}>
                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
               </Text>
            </TouchableOpacity>

            {showDatePicker && (
               <View>
                  <DateTimePicker
                     value={isSelectingStartDate ? startDate : endDate}
                     mode="date"
                     display="default"
                     onChange={(event, date) => {
                        // On Android, cancel returns undefined for date
                        // On iOS, cancel is identified by event.type being 'dismissed'
                        const isCancel = event.type === "dismissed" || date === undefined;

                        if (isCancel) {
                           setShowDatePicker(false); // Hide picker on cancel
                           setIsSelectingStartDate(true); // Reset to start date for next time
                           return;
                        }

                        if (date) {
                           if (isSelectingStartDate) {
                              setStartDate(date);
                              setIsSelectingStartDate(false); // Switch to end date selection
                           } else {
                              // Make sure end date is not before start date
                              if (date < startDate) {
                                 // Swap dates
                                 const temp = startDate;
                                 setStartDate(date);
                                 setEndDate(temp);
                              } else {
                                 setEndDate(date);
                              }

                              // Calculate date range based on selected interval
                              const diffTime = Math.abs(date.getTime() - startDate.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                              if (diffDays <= 7) {
                                 setDateRange("week");
                              } else if (diffDays <= 30) {
                                 setDateRange("month");
                              } else {
                                 setDateRange("year");
                              }

                              setShowDatePicker(false); // Hide picker after end date selection
                              fetchAnalyticsData(); // Fetch data with new range
                           }
                        }
                     }}
                  />
               </View>
            )}
         </View>

         {isLoading ? (
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={themeColors.green} />
            </View>
         ) : (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
               {/* Custom legend below the pie chart */}
               <View
                  style={[
                     styles.chartContainer,
                     {
                        backgroundColor: themeColors.page_background,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}>
                  <Text style={[styles.chartTitle, { color: themeColors.card_title }]}>{t("analytics.expenseDistribution")}</Text>

                  {/* Pie Chart for Category Distribution */}
                  {expenseData.length > 0 ? (
                     <>
                        <PieChart
                           data={expenseData}
                           width={screenWidth - 60}
                           height={220}
                           chartConfig={{
                              backgroundColor: themeColors.page_background,
                              backgroundGradientFrom: themeColors.page_background,
                              backgroundGradientTo: themeColors.page_background,
                              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                              labelColor: (opacity = 1) => "#000",
                           }}
                           accessor="value"
                           backgroundColor="transparent"
                           paddingLeft={horizontalScale(80).toString()}
                           absolute={false}
                           hasLegend={false}
                        />

                        {/* Custom legend */}
                        <View style={styles.customLegendContainer}>
                           {expenseData.map((item, index) => (
                              <View key={index} style={styles.customLegendItem}>
                                 <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                                 <Text style={{ color: themeColors.card_title }}>{t(`categories.${item.name.toLowerCase()}`)}</Text>
                              </View>
                           ))}
                        </View>
                     </>
                  ) : (
                     <View style={styles.noDataContainer}>
                        <Text style={{ color: themeColors.card_description }}>{t("analytics.noExpenseData")}</Text>
                     </View>
                  )}
               </View>

               {/* Income vs Expense - Pie Chart */}
               <View
                  style={[
                     styles.chartContainer,
                     {
                        backgroundColor: themeColors.page_background,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}>
                  <Text style={[styles.chartTitle, { color: themeColors.card_title }]}>{t("analytics.incomeExpenseGraph")}</Text>

                  {incomeData.incomeByMonth && incomeData.incomeByMonth.length > 0 ? (
                     <>
                        <PieChart
                           data={[
                              {
                                 name: t("analytics.income"),
                                 value: incomeData.incomeByMonth.reduce((sum, val) => sum + val, 0),
                                 color: themeColors.green,
                                 legendFontColor: themeColors.card_title,
                                 legendFontSize: 13,
                              },
                              {
                                 name: t("analytics.expenses"),
                                 value: incomeData.expenseByMonth.reduce((sum, val) => sum + val, 0),
                                 color: themeColors.red,
                                 legendFontColor: themeColors.card_title,
                                 legendFontSize: 13,
                              },
                           ]}
                           width={screenWidth - 60}
                           height={220}
                           chartConfig={{
                              backgroundColor: themeColors.page_background,
                              backgroundGradientFrom: themeColors.page_background,
                              backgroundGradientTo: themeColors.page_background,
                              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                              labelColor: (opacity = 1) => themeColors.card_title,
                           }}
                           accessor="value"
                           backgroundColor="transparent"
                           paddingLeft={horizontalScale(10).toString()}
                           absolute={false}
                           avoidFalseZero={true}
                        />

                        {/* Add a total summary below the chart */}
                        <View style={styles.incomeSummaryContainer}>
                           <View style={styles.summaryItem}>
                              <Text style={[styles.summaryLabel, { color: themeColors.card_title }]}>{t("analytics.totalIncome")}:</Text>
                              <Text style={[styles.summaryValue, { color: themeColors.green }]}>
                                 ${incomeData.incomeByMonth.reduce((sum, val) => sum + val, 0).toFixed(2)}
                              </Text>
                           </View>
                           <View style={styles.summaryItem}>
                              <Text style={[styles.summaryLabel, { color: themeColors.card_title }]}>{t("analytics.totalExpenses")}:</Text>
                              <Text style={[styles.summaryValue, { color: themeColors.red }]}>
                                 ${incomeData.expenseByMonth.reduce((sum, val) => sum + val, 0).toFixed(2)}
                              </Text>
                           </View>
                           <View style={styles.summaryItem}>
                              <Text style={[styles.summaryLabel, { color: themeColors.card_title }]}>{t("analytics.balance")}:</Text>
                              <Text
                                 style={[
                                    styles.summaryValue,
                                    {
                                       color:
                                          incomeData.incomeByMonth.reduce((sum, val) => sum + val, 0) -
                                             incomeData.expenseByMonth.reduce((sum, val) => sum + val, 0) >=
                                          0
                                             ? themeColors.green
                                             : themeColors.red,
                                    },
                                 ]}>
                                 $
                                 {(
                                    incomeData.incomeByMonth.reduce((sum, val) => sum + val, 0) -
                                    incomeData.expenseByMonth.reduce((sum, val) => sum + val, 0)
                                 ).toFixed(2)}
                              </Text>
                           </View>
                        </View>
                     </>
                  ) : (
                     <View style={styles.noDataContainer}>
                        <Text style={{ color: themeColors.card_description }}>{t("analytics.noIncomeExpenseData")}</Text>
                     </View>
                  )}
               </View>

               {/* Category Breakdown - Gifted Horizontal Bar Chart (Smaller) 
               <View
                  style={[
                     styles.chartContainer,
                     {
                        backgroundColor: themeColors.page_background,
                        borderColor: themeColors.frame_stroke,
                     },
                  ]}>
                  <Text style={[styles.chartTitle, { color: themeColors.card_title }]}>{t("analytics.categoryBreakdown")}</Text>

                  {expenseData.length > 0 ? (
                     <View style={styles.giftedHorizontalBarContainer}>
                        <BarChart
                           data={[...expenseData]
                              .sort((a, b) => b.value - a.value)
                              .map((item) => ({
                                 value: item.value,
                                 frontColor: item.color,
                                 // Increase substring length to show more text
                                 label: t(`categories.${item.name.toLowerCase()}`).substring(0, 20),
                                 labelTextStyle: {
                                    color: themeColors.card_title,
                                    fontSize: 11, // Increased font size
                                 },
                                 // Keep rightLabelComponent for values
                                 rightLabelComponent: () => (
                                    <Text
                                       style={[
                                          styles.barChartValueLabel,
                                          {
                                             color: themeColors.card_description,
                                             marginLeft: 6,
                                             fontSize: 11, // Match the font size
                                             fontWeight: "600",
                                          },
                                       ]}>
                                       ${item.value}
                                    </Text>
                                 ),
                                 leftShift: 15, // Reduced from 20 to make more room for label
                                 barWidth: 14,
                              }))}
                           horizontal
                           barWidth={14}
                           width={screenWidth - 140} // Increased chart area
                           hideRules
                           xAxisThickness={0}
                           yAxisThickness={0}
                           backgroundColor={themeColors.page_background}
                           showVerticalLines={false}
                           showYAxisIndices={false}
                           disableScroll={true}
                           yAxisLabelWidth={180} // Increased from 150 to give more space for labels
                           height={220}
                           barBorderRadius={4}
                           initialSpacing={10} // Slightly reduced to maximize space
                           endSpacing={60}
                           spacing={10} // Increased slightly for better separation
                        />
                     </View>
                  ) : (
                     <View style={styles.noDataContainer}>
                        <Text style={{ color: themeColors.card_description }}>{t("analytics.noExpenseData")}</Text>
                     </View>
                  )}
               </View>
               */}

               {/* Monthly Income vs Expense - Vertical Bar Chart */}
               {/* Additional charts can be added here */}
            </ScrollView>
         )}
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      paddingTop: verticalScale(50),
   },
   header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: horizontalScale(20),
      marginBottom: verticalScale(10),
   },
   loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
   },
   screenTitle: {
      fontSize: moderateScale(28),
      fontWeight: "bold",
      marginHorizontal: horizontalScale(20),
      marginBottom: verticalScale(20),
   },
   dateRangeContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: verticalScale(20),
      marginTop: verticalScale(50),
   },
   dateRangeButton: {
      paddingHorizontal: horizontalScale(20),
      paddingVertical: verticalScale(8),
      marginHorizontal: horizontalScale(5),
      borderRadius: moderateScale(20),
      borderWidth: 1,
      borderColor: "#ccc",
   },
   dateRangeText: {
      fontWeight: "500",
      fontSize: moderateScale(14),
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {
      paddingHorizontal: horizontalScale(20),
      paddingBottom: verticalScale(30),
   },
   chartContainer: {
      marginBottom: verticalScale(20),
      padding: moderateScale(15),
      borderRadius: moderateScale(15),
      borderWidth: 1,
      alignItems: "center",
      width: "100%",
      overflow: "hidden",
   },
   chartTitle: {
      fontSize: moderateScale(18),
      fontWeight: "600",
      marginBottom: verticalScale(15),
      alignSelf: "flex-start",
   },
   noDataContainer: {
      height: 200,
      justifyContent: "center",
      alignItems: "center",
   },
   lineChart: {
      marginVertical: 8,
      borderRadius: 15,
   },
   barChart: {
      marginVertical: 8,
      borderRadius: 15,
   },
   legendContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 10,
   },
   legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 15,
   },
   legendColor: {
      width: horizontalScale(12),
      height: horizontalScale(12),
      borderRadius: horizontalScale(6),
      marginRight: horizontalScale(5),
   },
   customLegendContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      marginTop: 10,
   },
   customLegendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: horizontalScale(15),
      marginBottom: verticalScale(5),
   },
   customChartContainer: {
      width: "100%",
      height: verticalScale(250),
      marginTop: verticalScale(15),
      flexDirection: "row",
   },
   yAxisContainer: {
      width: 40,
      height: "100%",
      justifyContent: "flex-start",
      position: "relative",
   },
   lineChartArea: {
      flex: 1,
      height: verticalScale(220),
      position: "relative",
   },
   gridLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 1,
   },
   axisLabel: {
      fontSize: moderateScale(10),
      position: "absolute",
      textAlign: "right",
   },
   xAxisContainer: {
      position: "absolute",
      bottom: -25,
      left: 0,
      right: 0,
      flexDirection: "row",
   },
   lineContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
   },
   line: {
      height: 2,
      position: "absolute",
   },
   dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      position: "absolute",
      marginLeft: -4,
      marginBottom: -4,
   },
   customBarChartContainer: {
      width: "100%",
      marginTop: 15,
   },
   barItemContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
      width: "100%",
   },
   barLabelContainer: {
      width: 100,
   },
   barLabel: {
      fontSize: 13,
   },
   barOuterContainer: {
      flex: 1,
      height: 28,
      borderRadius: 14,
      overflow: "hidden",
      position: "relative",
      borderWidth: 1,
   },
   barFill: {
      height: "100%",
      borderRadius: 14,
   },
   barValue: {
      position: "absolute",
      alignSelf: "center",
      top: verticalScale(5),
      fontWeight: "600",
      fontSize: moderateScale(12),
   },
   lineConnectorContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      alignItems: "flex-end",
   },
   lineSegment: {
      height: 2,
      position: "absolute",
   },
   verticalBarChartContainer: {
      width: "100%",
      height: verticalScale(250),
      flexDirection: "row",
      marginTop: verticalScale(10),
   },
   verticalBarChartContent: {
      flex: 1,
      height: verticalScale(220),
      position: "relative",
   },
   barsContainer: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-evenly",
      alignItems: "flex-end",
      paddingHorizontal: horizontalScale(10),
      paddingTop: verticalScale(30), // Add space at top for value labels
      marginBottom: verticalScale(20), // Add space at bottom for month labels
   },
   monthBarGroup: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
   },
   barContainer: {
      width: 15,
      height: "100%",
      justifyContent: "flex-end",
      marginHorizontal: 2,
      alignItems: "center", // Center the value text
   },
   verticalBar: {
      width: "100%",
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
   },
   monthLabel: {
      position: "absolute",
      bottom: -20,
      fontSize: 10,
      textAlign: "center",
      width: 40,
   },
   barValueText: {
      fontSize: moderateScale(9), // Smaller text
      fontWeight: "600",
      position: "absolute",
      bottom: "50%", // Center vertically along the bar
      textAlign: "center", // Change from right to center
      zIndex: 5, // Ensure it's on top of other elements
      width: horizontalScale(28), // Slightly narrower
   },
   barLabelWrapper: {
      position: "absolute",
      right: horizontalScale(-15),
      width: horizontalScale(45),
      height: verticalScale(15),
      alignItems: "center",
      justifyContent: "center",
      transform: [{ rotate: "-90deg" }],
      transformOrigin: "left top",
   },
   verticalBarLabel: {
      fontSize: 9,
      fontWeight: "600",
      textAlign: "center",
   },
   giftedBarChartContainer: {
      width: "100%",
      height: 280,
      marginVertical: 10,
      position: "relative", // Add this
      zIndex: 1, // Add this
   },
   barChartValueLabel: {
      fontSize: moderateScale(11), // Increased from 9
      fontWeight: "600",
      textAlign: "center",
      marginBottom: verticalScale(2), // Reduced from 4
   },
   tooltip: {
      paddingHorizontal: horizontalScale(8),
      paddingVertical: verticalScale(4),
      borderRadius: moderateScale(4),
      borderWidth: 1,
      borderColor: "#ccc",
   },
   giftedHorizontalBarContainer: {
      width: "100%",
      height: 200,
      alignItems: "flex-start",
      justifyContent: "center",
      zIndex: -1,
   },
   giftedLineChartContainer: {
      width: "100%",
      height: 260,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 10,
   },
   datePickerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: verticalScale(20),
      paddingLeft: horizontalScale(180),
   },
   datePickerButton: {
      paddingHorizontal: horizontalScale(24),
      paddingVertical: verticalScale(10),
      borderRadius: moderateScale(20),
      borderWidth: 1,
   },
   datePickerText: {
      fontWeight: "600",
      fontSize: 16,
   },
   dateRangePickerContainer: {
      position: "absolute",
      top: verticalScale(90),
      left: 0,
      right: 0,
      padding: moderateScale(20),
      borderRadius: moderateScale(10),
      borderWidth: 1,
      alignItems: "center",
      zIndex: 100,
      elevation: 5,
   },
   dateRangeLabel: {
      fontSize: moderateScale(16),
      fontWeight: "600",
      marginBottom: verticalScale(10),
   },
   datePickerButtonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 10,
   },
   datePickerActionButton: {
      flex: 1,
      paddingVertical: verticalScale(10),
      borderRadius: moderateScale(10),
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
   },
   tooltipContainer: {
      position: "absolute",
      paddingHorizontal: horizontalScale(10),
      paddingVertical: verticalScale(6),
      borderRadius: moderateScale(6),
      borderWidth: 1.5,
      minWidth: horizontalScale(60),
      alignItems: "center",
      // Increase elevation and z-index
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: 1000,
      // Fix positioning
      transform: [{ translateX: -30 }, { translateY: -45 }], // Add Y transform
   },
   tooltipText: {
      fontSize: 14,
      fontWeight: "bold",
   },
   tooltipType: {
      fontSize: 10,
      marginTop: 2,
   },
   incomeSummaryContainer: {
      width: "100%",
      marginTop: 15,
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: "#e0e0e0",
   },
   summaryItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 5,
   },
   summaryLabel: {
      fontSize: 14,
      fontWeight: "500",
   },
   summaryValue: {
      fontSize: 14,
      fontWeight: "700",
   },
});

export default AnalyticsScreen;
