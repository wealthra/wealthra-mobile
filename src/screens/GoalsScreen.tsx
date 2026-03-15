import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList, ActivityIndicator, Alert } from "react-native";
import { getThemeColors } from "../utils/getThemeColors";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import SideDrawer from "../../components/SideDrawer";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import AddGoalModal from "../../components/AddGoalModal";
import UpdateGoalModal from "../../components/UpdateGoalModal";
import { horizontalScale, verticalScale, moderateScale } from "../utils/scaling";
import { getGoals, addGoal, deleteGoal, updateGoal, calculateDaysRemaining } from "../services/api";
import type { GoalHistoryDto as Goal } from "../api/types/goal.types.ts";

interface GoalsScreenProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

interface SavingGoal {
   id: string;
   apiId?: number; // To store the API ID for deletion
   name: string;
   saved: number;
   target: number;
   daysLeft: number;
   color: string;
}

const { width: windowWidth } = Dimensions.get("window");

const GoalsScreen: React.FC<GoalsScreenProps> = ({ isDarkMode, onToggleTheme, navigation }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t } = useTranslation();
   const [profileImage, setProfileImage] = useState<string | null>(null);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
   const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
   const [currentPage, setCurrentPage] = useState(1);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   const [hasMoreData, setHasMoreData] = useState(true);

   // Calculate totals for goal overview
   const totalTarget = savingGoals.reduce((sum, goal) => sum + goal.target, 0);
   const totalSaved = savingGoals.reduce((sum, goal) => sum + goal.saved, 0);
   const savingPercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

   // Fetch goals from API
   const fetchGoals = async () => {
      try {
         setIsLoading(true);
         setError(null);

         const response = await getGoals(1, 10); // Get up to 10 goals
         console.log("Fetched goals:", response);

         // Transform API data to our component format
         const items = response.items || [];
         const transformedGoals = items.map((goal: Goal) => ({
            id: goal.id.toString(),
            apiId: goal.id, // Store API ID for future operations
            name: goal.name || "Untitled Goal",
            saved: goal.currentAmount || 0,
            target: goal.targetAmount,
            daysLeft: calculateDaysRemaining(goal.deadline || new Date().toISOString()),
            color: getColorForGoal(Math.floor(Math.random() * 3)), // Random color for now
         }));

         setSavingGoals(transformedGoals);
         // Check if we have more data to load
         setHasMoreData(response.hasNextPage ?? false);
      } catch (err: any) {
         console.error("Error fetching goals:", err);
         setError("Failed to load goals. Please try again.");
         Alert.alert("Error", "Failed to load goals. Please try again.");
      } finally {
         setIsLoading(false);
         setIsRefreshing(false);
      }
   };

   // Initial data fetch
   useEffect(() => {
      fetchGoals();
   }, []);

   const handleNavigate = (screen: string) => {
      navigation.navigate(screen);
   };

   const handleRefresh = () => {
      setIsRefreshing(true);
      fetchGoals();
   };

   const handleDelete = async (id: string) => {
      try {
         const goalToDelete = savingGoals.find((g) => g.id === id);

         if (!goalToDelete || !goalToDelete.apiId) {
            console.error("Cannot delete goal: Invalid ID or missing API ID");
            return;
         }

         // Show a confirmation dialog before deletion
         Alert.alert(
            t("alert.deletionTitle"), // "Delete Goal"
            t("alert.deletionMessage"), // "Are you sure you want to delete this goal?"
            [
               {
                  text: t("alert.cancel"), // "Cancel"
                  style: "cancel",
               },
               {
                  text: t("alert.confirm"), // "Delete"
                  style: "destructive",
                  onPress: async () => {
                     try {
                        // Delete from API
                        await deleteGoal(goalToDelete.apiId!);

                        // Update local state
                        setSavingGoals((goals) => goals.filter((goal) => goal.id !== id));
                     } catch (err: any) {
                        console.error("Error deleting goal:", err);
                        Alert.alert(t("alert.genericErrorTitle"), t("alert.failedToDelete"));
                     }
                  },
               },
            ]
         );
      } catch (error) {
         console.error("Error in handleDelete:", error);
         Alert.alert(t("alerts.titles.error"), t("alerts.error.generic"));
      }
   };

   const renderRightActions = (progress: any, dragX: any, id: string) => {
      return (
         <RectButton style={[styles.deleteButton, { backgroundColor: themeColors.red || "#FF3B30" }]} onPress={() => handleDelete(id)}>
            <View style={styles.deleteButtonInner}>
               <Text style={styles.deleteButtonText}>X</Text>
            </View>
         </RectButton>
      );
   };

   const renderGoalItem = ({ item: goal }: { item: SavingGoal }) => (
      <Swipeable
         key={goal.id}
         renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, goal.id)}
         overshootRight={false}
         onSwipeableOpen={() => handleDelete(goal.id)}>
         <TouchableOpacity
            style={[styles.goalItem, { backgroundColor: themeColors.page_background, borderColor: themeColors.frame_stroke }]}
            onPress={() => handleGoalSelect(goal)}>
            <View style={styles.goalHeaderContainer}>
               <Text style={[styles.goalName, { color: themeColors.card_title }]}>{goal.name}</Text>
               <Text style={[styles.daysLeftText, { color: themeColors.card_title }]}>
                  {goal.daysLeft} {t("daysLeft")}
               </Text>
            </View>
            <Text style={[styles.goalAmounts, { color: themeColors.card_description }]}>
               ${goal.saved.toLocaleString()}/${goal.target.toLocaleString()}
            </Text>
            <View style={[styles.goalProgressContainer, { backgroundColor: themeColors.page_background }, { borderColor: themeColors.frame_stroke }]}>
               <View
                  style={[
                     styles.goalProgress,
                     {
                        width: `${Math.min(100, (goal.saved / goal.target) * 100)}%`,
                        backgroundColor: goal.color,
                     },
                  ]}
               />
            </View>
         </TouchableOpacity>
      </Swipeable>
   );

   const handleAddGoal = async (goal: { name: string; targetAmount: number; initialDeposit: number; daysToTarget: number }) => {
      try {
         console.log("Adding new goal:", goal);

         // Add goal to API
         const newGoalId = await addGoal({
            name: goal.name,
            targetAmount: goal.targetAmount,
            initialAmount: goal.initialDeposit,
            daysToTarget: goal.daysToTarget,
         });

         // Add to local state with the returned ID
         const newGoal: SavingGoal = {
            id: newGoalId.toString(),
            apiId: newGoalId,
            name: goal.name,
            saved: goal.initialDeposit,
            target: goal.targetAmount,
            daysLeft: goal.daysToTarget,
            color: getColorForGoal(savingGoals.length % 3),
         };

         console.log("Creating new goal with saved amount:", newGoal.saved);
         setSavingGoals((prev) => [...prev, newGoal]);
         setIsModalVisible(false);
      } catch (err: any) {
         console.error("Error adding goal:", err);
         Alert.alert("Error", "Failed to add goal. Please try again.");
      }
   };

   const handleGoalSelect = (goal: SavingGoal) => {
      setSelectedGoal(goal);
      setIsUpdateModalVisible(true);
   };

   const handleUpdateGoal = async (updatedGoalData: { name: string; targetAmount: number; initialDeposit: number; daysToTarget: number }) => {
      try {
         if (!selectedGoal || !selectedGoal.apiId) {
            console.error("Cannot update goal: No goal selected or missing API ID");
            return;
         }

         console.log("Updating goal:", selectedGoal.id, updatedGoalData);

         // Call the API to update the goal with all properties except name
         await updateGoal(selectedGoal.apiId, {
            name: selectedGoal.name, // Keep the original name instead of using updatedGoalData.name
            targetAmount: updatedGoalData.targetAmount,
            initialAmount: updatedGoalData.initialDeposit,
            daysToTarget: updatedGoalData.daysToTarget,
         });

         // Update the goal in local state, but keep the original name
         setSavingGoals((prevGoals) =>
            prevGoals.map((goal) =>
               goal.id === selectedGoal.id
                  ? {
                       ...goal,
                       // name: updatedGoalData.name, // Remove this line to keep original name
                       target: updatedGoalData.targetAmount,
                       saved: updatedGoalData.initialDeposit,
                       daysLeft: updatedGoalData.daysToTarget,
                    }
                  : goal
            )
         );

         // Close the modal and clear the selected goal
         setIsUpdateModalVisible(false);
         setSelectedGoal(null);
      } catch (err: any) {
         console.error("Error updating goal:", err);
         Alert.alert("Error", "Failed to update goal. Please try again.");
      }
   };

   const getColorForGoal = (index: number) => {
      const colors = [themeColors.green || "#4CAF50", themeColors.blue || "#2196F3", themeColors.yellow || "#FFC107"];
      return colors[index % colors.length];
   };

   // Show loading indicator while fetching data
   if (isLoading && !isRefreshing) {
      return (
         <View style={[styles.container, styles.loadingContainer, { backgroundColor: themeColors.page_background }]}>
            <ActivityIndicator size="large" color={themeColors.card_title} />
            <Text style={{ color: themeColors.card_title, marginTop: 10 }}>Loading goals...</Text>
         </View>
      );
   }

   return (
      <View style={[styles.container, { backgroundColor: themeColors.page_background }]}>
         <View style={styles.headerSection}>
            <SideDrawer isDarkMode={isDarkMode} onNavigate={handleNavigate} currentRoute="Goals" />
         </View>

         <View style={styles.content}>
            <View style={[styles.overviewCard, { backgroundColor: themeColors.page_background, borderColor: themeColors.frame_stroke }]}>
               <Text style={[styles.cardTitle, { color: themeColors.card_title }]}>{t("totalSavingProgress")}</Text>
               <Text style={[styles.percentageText, { color: themeColors.card_title }]}>{savingPercentage}%</Text>
               <View
                  style={[styles.progressBarContainer, { backgroundColor: themeColors.page_background }, { borderColor: themeColors.frame_stroke }]}>
                  <View style={[styles.progressBar, { width: `${savingPercentage}%`, backgroundColor: themeColors.green || "#4CAF50" }]} />
               </View>
               <View style={styles.budgetAmountsContainer}>
                  <Text style={[styles.currentAmount, { color: themeColors.card_title }]}>${totalSaved.toLocaleString()}</Text>
                  <Text style={[styles.targetAmount, { color: themeColors.card_title }]}>${totalTarget.toLocaleString()}</Text>
               </View>
            </View>

            <View style={[styles.goalsCard, { backgroundColor: themeColors.page_background, borderColor: themeColors.frame_stroke }]}>
               <View style={styles.goalsHeader}>
                  <Text style={[styles.cardTitle, { color: themeColors.card_title }]}>{t("activeGoals")}</Text>
                  <TouchableOpacity
                     style={[styles.addButton, { borderColor: themeColors.frame_stroke, backgroundColor: themeColors.page_background }]}
                     onPress={() => setIsModalVisible(true)}>
                     <Text style={[styles.addButtonText, { color: themeColors.card_title }]}>+</Text>
                  </TouchableOpacity>
               </View>
               <FlatList
                  data={savingGoals}
                  renderItem={renderGoalItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={3}
                  maxToRenderPerBatch={3}
                  windowSize={3}
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  getItemLayout={(data, index) => ({
                     length: 110,
                     offset: 110 * index,
                     index,
                  })}
                  style={styles.goalList}
               />
            </View>
         </View>

         <AddGoalModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} onAdd={handleAddGoal} isDarkMode={isDarkMode} />
         <UpdateGoalModal
            visible={isUpdateModalVisible}
            onClose={() => {
               setIsUpdateModalVisible(false);
               setSelectedGoal(null);
            }}
            onUpdate={handleUpdateGoal}
            initialValues={selectedGoal || undefined}
            isDarkMode={isDarkMode}
         />
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 40,
   },
   loadingContainer: {
      justifyContent: "center",
   },
   content: {
      flex: 1,
      width: "100%",
      paddingHorizontal: 20,
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
   goalHeaderContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(10),
   },
   goalTitle: {
      fontSize: moderateScale(28),
      fontWeight: "bold",
   },
   overviewCard: {
      width: "100%",
      borderRadius: moderateScale(15),
      padding: moderateScale(20),
      marginBottom: verticalScale(10),
      borderWidth: 1,
   },
   cardTitle: {
      fontSize: moderateScale(20),
      fontWeight: "600",
      marginBottom: verticalScale(15),
   },
   percentageText: {
      fontSize: moderateScale(28),
      fontWeight: "bold",
      alignSelf: "flex-end",
   },
   progressBarContainer: {
      height: verticalScale(16),
      borderRadius: moderateScale(8),
      width: "100%",
      overflow: "hidden",
      marginVertical: verticalScale(10),
      borderWidth: 1,
   },
   progressBar: {
      height: "100%",
   },
   budgetAmountsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: verticalScale(5),
   },
   currentAmount: {
      fontSize: moderateScale(18),
      fontWeight: "500",
   },
   targetAmount: {
      fontSize: moderateScale(18),
      fontWeight: "500",
   },
   goalsCard: {
      flex: 1,
      width: "100%",
      borderRadius: moderateScale(24),
      padding: moderateScale(16),
      marginBottom: verticalScale(20),
      borderWidth: 1,
   },
   goalsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(8),
   },
   addButton: {
      width: horizontalScale(40),
      height: horizontalScale(40),
      borderRadius: horizontalScale(20),
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      borderWidth: 1,
   },
   addButtonText: {
      fontSize: moderateScale(24),
      fontWeight: "400",
   },
   goalList: {
      maxHeight: verticalScale(450),
   },
   goalItem: {
      height: verticalScale(110),
      marginBottom: verticalScale(15),
      padding: moderateScale(10),
      borderRadius: moderateScale(16),
      borderWidth: 1,
   },
   goalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: verticalScale(5),
   },
   goalName: {
      fontSize: moderateScale(18),
      fontWeight: "500",
   },
   daysLeftText: {
      fontSize: moderateScale(16),
      fontWeight: "normal",
   },
   goalAmounts: {
      fontSize: moderateScale(14),
      marginBottom: verticalScale(5),
   },
   goalProgressContainer: {
      height: 12,
      borderRadius: 6,
      width: "100%",
      overflow: "hidden",
      borderWidth: 1,
   },
   goalProgress: {
      height: "100%",
      borderRadius: 6,
   },
   deleteButton: {
      width: 80,
      height: 110,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 16,
      marginBottom: 15,
   },
   deleteButtonInner: {
      height: "100%",
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
   },
   deleteButtonText: {
      color: "white",
      fontSize: 24,
      fontWeight: "600",
   },
   emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 40,
   },
   emptyStateText: {
      fontSize: 16,
      textAlign: "center",
   },
});

export default GoalsScreen;
