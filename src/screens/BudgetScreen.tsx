import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList, ActivityIndicator } from "react-native";
import ConfirmationModal, { ModalButton } from "../../components/ConfirmationModal";
import { SvgXml } from "react-native-svg";
import { getThemeColors } from "../utils/getThemeColors";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../components/ScreenHeader";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import AddBudgetModal from "../../components/AddBudgetModal";
import UpdateBudgetModal from "../../components/UpdateBudgetModal";
import { getBudgets, addBudget, updateBudget, deleteBudget, getUserCategories } from "../services/api";
import type { BudgetDto } from "../services/api";
import { getCategoryColor } from "../utils/getCategoryColor";
import ActionFAB from "../../components/ActionFAB";
import { usePrivacy } from "../context/PrivacyContext";
import { getCurrencySymbol } from "../utils/currencyUtils";
import { useUser } from "../context/UserContext";

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
   const { isPrivacyMode } = usePrivacy();
   const { preferredCurrency } = useUser();
   const { t } = useTranslation();
   const [profileImage, setProfileImage] = useState<string | null>(null);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
   const [selectedBudget, setSelectedBudget] = useState<BudgetCategory | null>(null);
   const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [currentPage, setCurrentPage] = useState(1);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   const [hasMoreData, setHasMoreData] = useState(true);
   const [availableCategories, setAvailableCategories] = useState<string[]>([]);
   const [alertConfig, setAlertConfig] = useState<{
      visible: boolean;
      title: string;
      message: string;
      type: "success" | "error" | "warning" | "info";
      onConfirm?: () => void;
      buttons?: ModalButton[];
   }>({
      visible: false,
      title: "",
      message: "",
      type: "info",
   });

   const showAlert = (
      title: string, 
      message: string, 
      type: "success" | "error" | "warning" | "info" = "info", 
      onConfirm?: () => void,
      buttons?: ModalButton[]
   ) => {
      setAlertConfig({
         visible: true,
         title,
         message,
         type,
         onConfirm: onConfirm || (() => setAlertConfig(prev => ({ ...prev, visible: false }))),
         buttons,
      });
   };

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

         const response = await getBudgets(page, 10, preferredCurrency);
         const categories = await getUserCategories();
         console.log(`Fetched budgets (Page ${page}):`, JSON.stringify(response, null, 2));

         // Transform API data to our component format
         // Use normalization to handle both raw arrays and PaginatedListOfBudgetDto objects
         const items = response.items || (Array.isArray(response) ? response : []);
         const normalizedItems = items.map((budget: BudgetDto) => {
            const category = categories.find((c: any) => 
               (c.categoryName || c.name || '').toLowerCase() === budget.categoryName?.toLowerCase() || 
               c.id === budget.categoryId
            );
            return {
               ...budget,
               categoryName: category ? (category.categoryName || category.name || `Category ${budget.categoryId}`) : `Category ${budget.categoryId}`,
            };
         });

         const transformedBudgets = normalizedItems.map((budget: any) => ({
            id: budget.id.toString(),
            name: budget.categoryName,
            spent: budget.currentAmount || 0,
            budgeted: budget.limitAmount,
            color: getCategoryColor(budget.categoryName, isDarkMode),
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
         showAlert("Error", "Failed to load budgets. Please try again.", "error");
         setHasMoreData(false);
      } finally {
         setIsLoading(false);
         setIsRefreshing(false);
         setIsLoadingMore(false);
      }
   };

   // Fetch categories from API
   const fetchCategories = async () => {
      try {
         console.log("Fetching budget categories...");
         const categories = await getUserCategories();
         console.log("Fetched categories from API:", JSON.stringify(categories, null, 2));

         const categoryNames = categories
            .map((c) => c.categoryName || c.name)
            .filter((name): name is string => !!name);

         console.log("Processed category names for dropdown:", categoryNames);
         setAvailableCategories(categoryNames);
      } catch (err) {
         console.error("Error fetching categories:", err);
         // Fallback to empty list but log it clearly
         setAvailableCategories([]);
      }
   };

   // Log current categories whenever they change
   useEffect(() => {
      console.log("BUDGET_SCREEN_CATEGORIES_STATE_UPDATE:", availableCategories);
   }, [availableCategories]);

   // Initial data fetch
   useEffect(() => {
      fetchBudgets();
      fetchCategories();
   }, [preferredCurrency]);

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
            showAlert(t("alerts.titles.error") || "Error", t("alerts.error.invalidId") || "Invalid ID", "error");
            return;
         }

         // Show a confirmation dialog before deletion
         showAlert(
            t("alert.deletionTitle") || "Delete Budget",
            t("alert.deletionMessage") || "Are you sure you want to delete this budget?",
            "warning",
            undefined,
            [
               {
                  text: t("alert.cancel") || "Cancel",
                  onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })),
                  type: "cancel"
               },
               {
                  text: t("alert.confirm") || "Delete",
                  onPress: async () => {
                     setAlertConfig(prev => ({ ...prev, visible: false }));
                     try {
                        // Delete from API
                        await deleteBudget(budgetToDelete.apiId!);

                        // Re-fetch data from API
                        await fetchBudgets(1, false);
                     } catch (err: any) {
                        console.error("Error deleting budget:", err);
                        showAlert(t("alert.genericErrorTitle") || "Error", t("alert.failedToDelete") || "Failed to delete budget", "error");
                     }
                  },
                  type: "confirm",
                  color: themeColors.red
               },
            ]
         );
      } catch (error) {
         console.error("Error in handleDelete:", error);
         showAlert(t("alerts.titles.error") || "Error", t("alerts.error.generic") || "An unexpected error occurred.", "error");
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
            <TouchableOpacity
               activeOpacity={0.7}
               onPress={() => {
                  setSelectedBudget(category);
                  setIsUpdateModalVisible(true);
               }}
               style={[styles.categoryItem, { backgroundColor: themeColors.card_background, borderColor: themeColors.frame_stroke }]}>
               <View style={styles.categoryHeader}>
                  <Text style={[styles.categoryName, { color: themeColors.card_title }]}>{translatedCategoryName}</Text>
                  <Text style={[styles.percentageIndicator, { color: themeColors.card_title }]}>{percentSpent}%</Text>
               </View>
               <Text style={[styles.categoryAmounts, { color: themeColors.card_description }]}>
                  {isPrivacyMode ? "****" : `${getCurrencySymbol(preferredCurrency)}${category.spent.toLocaleString()}`} / {isPrivacyMode ? "****" : `${getCurrencySymbol(preferredCurrency)}${category.budgeted.toLocaleString()}`}
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
            </TouchableOpacity>
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

         // Re-fetch data from API
         await fetchBudgets(1, false);
         setIsModalVisible(false);
      } catch (err: any) {
         console.error("Error adding budget:", err);
         showAlert(t("alert.genericErrorTitle") || "Error", t("alert.failedToAdd") || "Failed to add budget", "error");
      }
   };

   const handleUpdateBudget = async (id: number, budgetLimit: number) => {
      try {
         setIsLoading(true);
         await updateBudget(id, {
            budgetLimit: budgetLimit,
            currency: preferredCurrency,
         });

         // Re-fetch data from API
         await fetchBudgets(currentPage, false);

         showAlert(t("common.success") || "Success", t("budget.updated") || "Budget updated successfully", "success");
         setIsUpdateModalVisible(false);
         setSelectedBudget(null);
      } catch (err: any) {
         console.error("Error updating budget:", err);
         showAlert(t("common.error") || "Error", t("budget.updateFailed") || "Failed to update budget", "error");
      } finally {
         setIsLoading(false);
      }
   };

   // Removed local getColorForCategory in favor of getCategoryColor utility


   // Show loading indicator while fetching data
   if (isLoading && !isRefreshing) {
      return (
         <View style={[styles.container, styles.loadingContainer, { backgroundColor: themeColors.page_background }]}>
            <ActivityIndicator size="large" color={themeColors.card_title} />
            <Text style={{ color: themeColors.card_title, marginTop: 10 }}>{t("common.loadingBudgets")}</Text>
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
                  <Text style={[styles.currentAmount, { color: themeColors.card_title }]}>{isPrivacyMode ? "****" : `${getCurrencySymbol(preferredCurrency)}${totalSpent.toLocaleString()}`}</Text>
                  <Text style={[styles.targetAmount, { color: themeColors.card_title }]}>{isPrivacyMode ? "****" : `${getCurrencySymbol(preferredCurrency)}${totalBudgeted.toLocaleString()}`}</Text>
               </View>
            </View>

            <View style={[styles.categoriesCard, { backgroundColor: themeColors.card_background, borderColor: themeColors.frame_stroke }]}>
               <View style={styles.categoriesHeader}>
                  <Text style={[styles.cardTitle, { color: themeColors.card_title }]}>{t("budgetCategories")}</Text>
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

         <UpdateBudgetModal
            visible={isUpdateModalVisible}
            onClose={() => {
               setIsUpdateModalVisible(false);
               setSelectedBudget(null);
            }}
            onUpdate={handleUpdateBudget}
            isDarkMode={isDarkMode}
            initialBudget={selectedBudget ? {
               id: selectedBudget.apiId!,
               categoryName: selectedBudget.name,
               budgetLimit: selectedBudget.budgeted
            } : null}
         />
         <AddBudgetModal
            visible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            onAdd={handleAddBudget}
            isDarkMode={isDarkMode}
            categories={availableCategories}
         />
         <ActionFAB isDarkMode={isDarkMode} onPress={() => setIsModalVisible(true)} />
         
         <ConfirmationModal
            visible={alertConfig.visible}
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            isDarkMode={isDarkMode}
            buttons={alertConfig.buttons}
            onConfirm={() => {
               if (alertConfig.onConfirm) alertConfig.onConfirm();
               setAlertConfig(prev => ({ ...prev, visible: false }));
            }}
            onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
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
