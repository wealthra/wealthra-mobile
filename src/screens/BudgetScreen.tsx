import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList, ActivityIndicator, Alert } from "react-native";
import { SvgXml } from "react-native-svg";
import { getThemeColors } from "../utils/getThemeColors";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../components/ScreenHeader";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import AddBudgetModal from "../../components/AddBudgetModal";
import { getBudgets, addBudget, deleteBudget } from "../services/api";
import type { BudgetDto } from "../services/api";
import { getCategoryColor } from "../utils/getCategoryColor";

interface BudgetScreenProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

interface BudgetCategory {
   id: string;
   name: string;
   spent: number;
   budgeted: number;
   color: string;
   apiId?: number; // To store the API ID for deletion
   categoryId?: number; // To store the category ID for future operations
}

const { width: windowWidth } = Dimensions.get("window");

const BudgetScreen: React.FC<BudgetScreenProps> = ({ isDarkMode, onToggleTheme, navigation }) => {
   const themeColors = getThemeColors(isDarkMode);
   const { t } = useTranslation();
   const [profileImage, setProfileImage] = useState<string | null>(null);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [currentPage, setCurrentPage] = useState(1);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   const [hasMoreData, setHasMoreData] = useState(true);

   // Calculate totals for the budget overview
   const totalBudgeted = budgetCategories.reduce((sum, category) => sum + category.budgeted, 0);
   const totalSpent = budgetCategories.reduce((sum, category) => sum + category.spent, 0);
   const budgetPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

   // Fetch budgets from API
   const fetchBudgets = async (page = 1, shouldAppend = false) => {
      try {
         if (page === 1) {
            setIsLoading(true);
         } else {
            setIsLoadingMore(true);
         }
         setError(null);

         const response = await getBudgets(page, 10);
         console.log("Fetched budgets:", response);

         // Transform API data to our component format
         const budgets = response.items || [];
         const transformedBudgets = budgets.map((budget: BudgetDto) => ({
            id: budget.id.toString(),
            name: budget.categoryName || `Category ${budget.categoryId}`, // Use category name if available
            spent: budget.currentAmount || 0,
            budgeted: budget.limitAmount,
            color: getCategoryColor(budget.categoryName || `Category ${budget.categoryId}`, isDarkMode),
            apiId: budget.id, // Store API ID for future operations
            categoryId: budget.categoryId, // Store category ID for future operations
         }));

         // Check if we have more data to load
         setHasMoreData(response.hasNextPage ?? false);

         // Update the current page
         setCurrentPage(page);

         // Either replace or append the data
         if (shouldAppend) {
            setBudgetCategories((prev) => [...prev, ...transformedBudgets]);
         } else {
            setBudgetCategories(transformedBudgets);
         }
      } catch (err: any) {
         console.error("Error fetching budgets:", err);
         setError("Failed to load budgets. Please try again.");
         Alert.alert("Error", "Failed to load budgets. Please try again.");
         setHasMoreData(false);
      } finally {
         setIsLoading(false);
         setIsRefreshing(false);
         setIsLoadingMore(false);
      }
   };

   // Initial data fetch
   useEffect(() => {
      fetchBudgets();
   }, []);

   const handleNavigate = (screen: string) => {
      navigation.navigate(screen);
   };

   const handleRefresh = () => {
      setIsRefreshing(true);
      fetchBudgets();
   };

   const handleDelete = async (id: string) => {
      try {
         const budgetToDelete = budgetCategories.find((b) => b.id === id);

         if (!budgetToDelete || !budgetToDelete.apiId) {
            console.error("Cannot delete budget: Invalid ID or missing API ID");
            Alert.alert(t("alerts.titles.error"), t("alerts.error.invalidId"));
            return;
         }

         // Show a confirmation dialog before deletion
         Alert.alert(t("alert.deletionTitle"), t("alert.deletionMessage"), [
            {
               text: t("alert.cancel"),
               style: "cancel",
            },
            {
               text: t("alert.confirm"),
               style: "destructive",
               onPress: async () => {
                  try {
                     // Delete from API
                     await deleteBudget(budgetToDelete.apiId!);

                     // Update local state
                     setBudgetCategories((categories) => categories.filter((category) => category.id !== id));
                  } catch (err: any) {
                     console.error("Error deleting budget:", err);
                     Alert.alert(t("alert.genericErrorTitle"), t("alert.failedToDelete"));
                  }
               },
            },
         ]);
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

   const renderCategoryItem = ({ item: category }: { item: BudgetCategory }) => {
      const percentSpent = category.budgeted > 0 ? Math.round((category.spent / category.budgeted) * 100) : 0;

      // Translate the category name
      const translatedCategoryName = t(`categories.${(category.name || "miscellaneous").toLowerCase().replace(/\s+/g, "_")}`);

      return (
         <Swipeable
            key={category.id}
            renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, category.id)}
            overshootRight={false}
            onSwipeableOpen={() => handleDelete(category.id)}>
            <View style={[styles.categoryItem, { backgroundColor: themeColors.card_background, borderColor: themeColors.frame_stroke }]}>
               <View style={styles.categoryHeader}>
                  <Text style={[styles.categoryName, { color: themeColors.card_title }]}>{translatedCategoryName}</Text>
                  <Text style={[styles.percentageIndicator, { color: themeColors.card_title }]}>{percentSpent}%</Text>
               </View>
               <Text style={[styles.categoryAmounts, { color: themeColors.card_description }]}>
                  ${category.spent.toLocaleString()}/${category.budgeted.toLocaleString()}
               </Text>
               <View
                  style={[
                     styles.categoryProgressContainer,
                     { backgroundColor: themeColors.card_background },
                     { borderColor: themeColors.frame_stroke },
                  ]}>
                  <View
                     style={[
                        styles.categoryProgress,
                        {
                           width: `${Math.min(100, percentSpent)}%`,
                           backgroundColor: category.color,
                        },
                     ]}
                  />
               </View>
            </View>
         </Swipeable>
      );
   };

   const handleAddBudget = async (budget: { category: string; budgetLimit: number; currentAmount: number }) => {
      try {
         console.log("Adding new budget:", budget);

         // Add budget to API
         const newBudgetId = await addBudget({
            category: budget.category,
            budgetLimit: budget.budgetLimit,
            currentAmount: budget.currentAmount,
         });

         // Store the original category name for API operations and translation
         const originalCategoryName = budget.category;

         // Add to local state with the initial spent amount
         const newCategory: BudgetCategory = {
            id: Date.now().toString(), // Local ID for list rendering
            name: originalCategoryName, // Store the original name for translation
            spent: budget.currentAmount,
            budgeted: budget.budgetLimit,
            color: getCategoryColor(originalCategoryName, isDarkMode),
            apiId: newBudgetId,
         };

         setBudgetCategories((prev) => [...prev, newCategory]);
         setIsModalVisible(false);
      } catch (err: any) {
         console.error("Error adding budget:", err);
         Alert.alert(t("alert.genericErrorTitle"), t("alert.failedToAdd"));
      }
   };

   // Removed local getColorForCategory in favor of getCategoryColor utility

   const availableCategories = ["Food", "Housing", "Entertainment", "Transport", "Education", "Shopping", "Healthcare", "Other"];

   // Show loading indicator while fetching data
   if (isLoading && !isRefreshing) {
      return (
         <View style={[styles.container, styles.loadingContainer, { backgroundColor: themeColors.page_background }]}>
            <ActivityIndicator size="large" color={themeColors.card_title} />
            <Text style={{ color: themeColors.card_title, marginTop: 10 }}>Loading budgets...</Text>
         </View>
      );
   }

   const handleLoadMore = () => {
      if (!isLoadingMore && hasMoreData) {
         fetchBudgets(currentPage + 1, true);
      }
   };

   const renderFooter = () => {
      if (!isLoadingMore) return null;

      return (
         <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={themeColors.green} />
            <Text style={{ color: themeColors.card_title, marginLeft: 8 }}>{t("common.loadingMore")}</Text>
         </View>
      );
   };

   return (
      <View style={[styles.container, { backgroundColor: themeColors.page_background }]}>
         <ScreenHeader isDarkMode={isDarkMode} onNavigate={handleNavigate} currentRoute="Budget" />
         <View style={styles.content}>
            <View style={[styles.overviewCard, { backgroundColor: themeColors.card_background, borderColor: themeColors.frame_stroke }]}>
               <Text style={[styles.cardTitle, { color: themeColors.card_title }]}>{t("monthlyBudgetOverview")}</Text>
               <Text style={[styles.percentageText, { color: themeColors.card_title }]}>{budgetPercentage}%</Text>
               <View
                  style={[styles.progressBarContainer, { backgroundColor: themeColors.card_background }, { borderColor: themeColors.frame_stroke }]}>
                  <LinearGradient
                     colors={["#FFA500", "#FF8C00"]}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 0 }}
                     style={[styles.progressBar, { width: `${budgetPercentage}%` }]}
                  />
               </View>
               <View style={styles.budgetAmountsContainer}>
                  <Text style={[styles.currentAmount, { color: themeColors.card_title }]}>${totalSpent.toLocaleString()}</Text>
                  <Text style={[styles.targetAmount, { color: themeColors.card_title }]}>${totalBudgeted.toLocaleString()}</Text>
               </View>
            </View>

            <View style={[styles.categoriesCard, { backgroundColor: themeColors.card_background, borderColor: themeColors.frame_stroke }]}>
               <View style={styles.categoriesHeader}>
                  <Text style={[styles.cardTitle, { color: themeColors.card_title }]}>{t("budgetCategories")}</Text>
                  <TouchableOpacity
                     style={[styles.addButton, { borderColor: themeColors.frame_stroke, backgroundColor: themeColors.card_background }]}
                     onPress={() => setIsModalVisible(true)}>
                     <Text style={[styles.addButtonText, { color: themeColors.card_title }]}>+</Text>
                  </TouchableOpacity>
               </View>

               <FlatList
                  data={budgetCategories}
                  renderItem={renderCategoryItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={5}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={renderFooter}
                  getItemLayout={(data, index) => ({
                     length: 85,
                     offset: 85 * index,
                     index,
                  })}
                  style={styles.categoryList}
               />
            </View>
         </View>

         <AddBudgetModal
            visible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            onAdd={handleAddBudget}
            isDarkMode={isDarkMode}
            categories={availableCategories}
         />
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
   },
   loadingContainer: {
      justifyContent: "center",
   },
   content: {
      flex: 1,
      width: "100%",
      paddingHorizontal: 20,
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
   budgetHeader: {
      width: "100%",
      marginBottom: 10,
   },
   budgetTitle: {
      fontSize: 28,
      fontWeight: "bold",
   },
   overviewCard: {
      width: "100%",
      borderRadius: 15,
      padding: 20,
      marginBottom: 10,
      borderWidth: 1,
   },
   cardTitle: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 15,
   },
   percentageText: {
      fontSize: 28,
      fontWeight: "bold",
      alignSelf: "flex-end",
   },
   progressBarContainer: {
      height: 16,
      borderRadius: 8,
      width: "100%",
      overflow: "hidden",
      marginVertical: 10,
      borderWidth: 1,
   },
   progressBar: {
      height: "100%",
   },
   budgetAmountsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 5,
   },
   currentAmount: {
      fontSize: 18,
      fontWeight: "500",
   },
   targetAmount: {
      fontSize: 18,
      fontWeight: "500",
   },
   categoriesCard: {
      flex: 1,
      width: "100%",
      borderRadius: 24,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
   },
   categoriesHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
   },
   addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      borderWidth: 1,
   },
   addButtonText: {
      fontSize: 24,
      fontWeight: "400",
   },
   categoryList: {
      maxHeight: 450,
   },
   categoryItem: {
      height: 90,
      marginBottom: 15,
      padding: 10,
      borderRadius: 16,
      borderWidth: 1,
   },
   categoryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 5,
   },
   categoryName: {
      fontSize: 18,
      fontWeight: "500",
   },
   percentageIndicator: {
      fontSize: 18,
      fontWeight: "bold",
   },
   categoryAmounts: {
      fontSize: 14,
      marginBottom: 5,
   },
   categoryProgressContainer: {
      height: 12,
      borderRadius: 6,
      width: "100%",
      overflow: "hidden",
      borderWidth: 1,
   },
   categoryProgress: {
      height: "100%",
      borderRadius: 6,
   },
   deleteButton: {
      width: 80,
      height: 90,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 16,
      marginBottom: 5,
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
   footerLoader: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      padding: 10,
      height: 50,
   },
});

export default BudgetScreen;
