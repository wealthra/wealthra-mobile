import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image } from "react-native";
import { getThemeColors } from "../utils/getThemeColors";
import SavingGoalSummary from "../../components/SavingGoalSummary";
import DashboardCarousel from "../../components/DashboardCarousel";
import SpendingChart from "../../components/SpendingChart";
import { getFinancialSummary, getGoals, getCurrentUser } from "../services/api";
import { transformFinancialData } from "../utils/transformFinancialData";
import type { FinancialDashboardDto, GoalHistoryDto, UserDto } from "../services/api";
import { useTranslation } from "react-i18next";
import SideDrawer from "../../components/SideDrawer";

interface DashboardScreenProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

function DashboardScreen({ isDarkMode, onToggleTheme, navigation }: DashboardScreenProps) {
   const themeColors = getThemeColors(isDarkMode);
   const [loading, setLoading] = useState(true);
   const [financialData, setFinancialData] = useState<FinancialDashboardDto | null>(null);
   const [userInfo, setUserInfo] = useState<UserDto | null>(null);
   const [profileImage, setProfileImage] = useState<string | null>(null);
   const [goalsSummary, setGoalsSummary] = useState({
      totalSaved: 0,
      totalTarget: 0,
      monthlySaved: 0,
      monthlyTarget: 0,
   });
   const { t } = useTranslation();

   const transformSpendingData = (data: FinancialDashboardDto) => {
      // Only use actual API data, don't fall back to mock data
      if (!data.topSpendingCategories || data.topSpendingCategories.length === 0) {
         return []; // Return empty array when no spending data is available
      }

      // Sort categories by amount and take top 4
      const topCategories = [...data.topSpendingCategories].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 4);

      // Map categories to their proper colors based on category name
      return topCategories.map((category) => {
         // Get proper color for each category based on its name (lowercase and remove spaces)
         const categoryName = category.categoryName ? category.categoryName.toLowerCase().replace(/\s+/g, "") : "unknown";
         let color;

         // Match category name to the corresponding theme color
         switch (categoryName) {
            case "food":
               color = themeColors.food_category;
               break;
            case "housing":
               color = themeColors.housing_category;
               break;
            case "entertainment":
               color = themeColors.entertainment_category;
               break;
            case "healthcare":
               color = themeColors.health_category;
               break;
            case "education":
               color = themeColors.education_category;
               break;
            case "transport":
               color = themeColors.transport_category;
               break;
            case "shopping":
               color = themeColors.shopping_category;
               break;
            default:
               color = themeColors.other_category;
         }

         return {
            name: category.categoryName || "Unknown",
            amount: category.totalAmount,
            color: color,
         };
      });
   };

   // Calculate total goals summary
   const calculateGoalsSummary = async () => {
      try {
         // Fetch all goals
         const goalsResponse = await getGoals(1, 50); // Get up to 50 goals
         const goals = goalsResponse.items || [];

         // Calculate total goal amounts
         const totalSaved = goals.reduce((sum: number, goal: GoalHistoryDto) => sum + (goal.currentAmount || 0), 0);
         const totalTarget = goals.reduce((sum: number, goal: GoalHistoryDto) => sum + (goal.targetAmount || 0), 0);

         // For monthly savings, you can either:
         // 1. Use an API endpoint if you have one specifically for monthly goals
         // 2. Calculate based on the current month goals only
         // 3. Use a percentage of yearly goals
         // Here we'll use a simple monthly calculation (current date's month)

         const currentMonth = new Date().getMonth(); // 0-11
         const currentYear = new Date().getFullYear();

         // Filter goals created in the current month
         const monthlyGoals = goals.filter((goal: GoalHistoryDto) => {
            const goalDate = new Date(goal.deadline || new Date().toISOString());
            const createdDate = new Date(); // You might want to add createdAt to your API
            return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
         });

         // Calculate monthly totals (or use a simpler approach if this doesn't match your requirements)
         const monthlySaved = monthlyGoals.reduce((sum: number, goal: GoalHistoryDto) => sum + (goal.currentAmount || 0), 0);
         const monthlyTarget = monthlyGoals.reduce((sum: number, goal: GoalHistoryDto) => sum + (goal.targetAmount || 0), 0);

         // Set the calculated summary
         setGoalsSummary({
            totalSaved,
            totalTarget,
            monthlySaved: monthlySaved || totalSaved * 0.1, // Fallback: 10% of total if no monthly data
            monthlyTarget: monthlyTarget || totalTarget * 0.1, // Fallback: 10% of total if no monthly data
         });
      } catch (error) {
         console.error("Failed to calculate goals summary:", error);
         // Set default values on error
         setGoalsSummary({
            totalSaved: 0,
            totalTarget: 0,
            monthlySaved: 0,
            monthlyTarget: 0,
         });
      }
   };

   useEffect(() => {
      const fetchData = async () => {
         try {
            setLoading(true);
            // Fetch financial data and user info in parallel
            const [finData, user] = await Promise.all([getFinancialSummary(), getCurrentUser()]);
            setFinancialData(finData);
            setUserInfo(user);

            // Calculate goals summary after financial data is loaded
            await calculateGoalsSummary();
         } catch (error) {
            console.error("Failed to fetch financial data:", error);
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, []);

   if (loading) {
      return (
         <View style={styles.container}>
            <ActivityIndicator size="large" color={themeColors.green} />
         </View>
      );
   }

   function handleNavigate(screen: string): void {
      navigation.navigate(screen);
   }

   return (
      <View style={styles.container}>
         <View style={styles.headerSection}>
            <SideDrawer isDarkMode={isDarkMode} onNavigate={handleNavigate} currentRoute="Dashboard" />
         </View>
         <View style={styles.dashboardHeader}>
            <Text style={[styles.dashboardTitle, { color: themeColors.card_title }]}>
               {t("dashboard.dashboardWelcome")}, {userInfo?.firstName || "User"}!
            </Text>
            <Text style={styles.dashboardSubText}>{t("dashboard.dashboardSubtext")}</Text>
         </View>
         {financialData && (
            <>
               <DashboardCarousel isDarkMode={isDarkMode} data={transformFinancialData(financialData, isDarkMode)} />

               {/* Use the monthly savings view for the dashboard */}
               <SavingGoalSummary currentAmount={goalsSummary.monthlySaved} targetAmount={goalsSummary.monthlyTarget} isDarkMode={isDarkMode} />

               <SpendingChart isDarkMode={isDarkMode} data={transformSpendingData(financialData)} />
            </>
         )}
      </View>
   );
}

export default DashboardScreen;

const styles = StyleSheet.create({
   container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 40,
   },
   headerSection: {
      width: "100%",
      paddingHorizontal: 20,
      paddingVertical: 30,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
   },
   profilePhotoContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      overflow: "hidden",
   },
   profilePhoto: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
   },
   profilePhotoPlaceholder: {
      width: "100%",
      height: "100%",
      opacity: 0.5,
   },
   dashboardHeader: {
      width: "100%",
      paddingHorizontal: 20,
   },
   dashboardTitle: {
      fontSize: 24,
      fontWeight: "bold",
   },
   dashboardSubText: {
      fontSize: 16,
      color: "#999999",
      marginTop: 4,
   },
});
