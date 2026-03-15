import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, FlatList, Alert } from "react-native";
import { getThemeColors } from "../utils/getThemeColors";
import { API_URL, getStoredToken, getExpenses, deleteExpense, addExpense, getUserCategories, getStoredUserId } from "../services/api";
import { useTranslation } from "react-i18next";
import SideDrawer from "../../components/SideDrawer";
import type { FinancialSummary } from "../services/api";
import { transformFinancialData } from "../utils/transformFinancialData";
import DashboardCarousel from "../../components/DashboardCarousel";
import { getFinancialSummary } from "../services/api";
import AddExpenseModal from "../../components/AddExpenseModal";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import axios from "axios";
import { horizontalScale, verticalScale, moderateScale } from "../utils/scaling";

interface ExpenseScreenProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

interface ExpenseSource {
   id: number;
   description: string;
   amount: number;
   paymentMethod: string;
   isRecurring: boolean;
   categoryId: number;
   categoryName: string;
}

interface ExpenseCategory {
   id: number;
   name: string;
}

interface Transaction {
   date: string;
   source: string;
   amount: number;
}

// Add the interface for the API response
interface ExpenseResponse {
   pageNumber: number;
   pageSize: number;
   data: {
      id: number;
      description: string;
      amount: number;
      paymentMethod: string;
      isRecurring: boolean;
      categoryId: number;
      categoryName: string;
   }[];
}

interface CategoryResponse {
   pageNumber: number;
   pageSize: number;
   data: ExpenseCategory[];
}

const ExpenseScreen: React.FC<ExpenseScreenProps> = ({ isDarkMode, onToggleTheme, navigation }) => {
   const themeColors = getThemeColors(isDarkMode);
   const [loading, setLoading] = useState(true);
   const [profileImage, setProfileImage] = useState<string | null>(null);
   const [financialData, setFinancialData] = useState<FinancialSummary | null>(null);
   const [expenses, setExpenses] = useState<ExpenseSource[]>([]);
   const [categories, setCategories] = useState<ExpenseCategory[]>([]);
   const [transactions, setTransactions] = useState<Transaction[]>([]);
   const [isAddModalVisible, setIsAddModalVisible] = useState(false);
   const [currentPage, setCurrentPage] = useState(1);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   const [hasMoreData, setHasMoreData] = useState(true);
   const pageSize = 10;
   const { t, i18n } = useTranslation();

   useEffect(() => {
      const fetchInitialData = async () => {
         try {
            setLoading(true);

            // Fetch categories first
            await fetchCategories();

            const [finData] = await Promise.all([getFinancialSummary()]);

            setFinancialData(finData);
         } catch (error) {
            console.error("Failed to fetch initial data:", error);
         } finally {
            setLoading(false);
         }
      };

      fetchInitialData();
   }, []);

   useEffect(() => {
      const fetchExpenses = async () => {
         try {
            setLoading(true);

            // Use the updated getExpenses function that now includes userId in the path
            const response = await getExpenses(1, 10);

            const items = response.items || [];
            const mappedExpenses = items.map((expense: any) => ({
               id: expense.id,
               description: expense.description,
               amount: expense.amount,
               paymentMethod: expense.paymentMethod,
               isRecurring: expense.isRecurring,
               categoryId: expense.categoryId,
               categoryName: expense.categoryName,
            }));

            setExpenses(mappedExpenses);

            // Set initial transaction from first expense if exists
            if (mappedExpenses.length > 0) {
               const recentExpenses = mappedExpenses.slice(0, 2);
               setTransactions(
                  recentExpenses.map((expense) => ({
                     date: new Date().toISOString().split("T")[0],
                     source: expense.description,
                     amount: expense.amount,
                  }))
               );
            }
         } catch (error) {
            console.error("Failed to fetch expenses:", error);
         } finally {
            setLoading(false);
         }
      };

      fetchExpenses();
   }, []);

   const fetchCategories = async () => {
      try {
         const response = await getUserCategories();
         const currentLang = i18n.language as "en" | "tr";

         if (response && response.length > 0) {
            setCategories(
               response.map((category: any) => ({
                  id: category.id,
                  name: category.name, // Use current language
               }))
            );
         }
      } catch (error) {
         console.error("Failed to fetch categories:", error);
      }
   };

   useEffect(() => {
      // Refresh categories when language changes
      fetchCategories();
   }, [i18n.language]); // Re-fetch when language changes

   function handleNavigate(screen: string): void {
      navigation.navigate(screen);
   }

   const renderRightActions = (progress: any, dragX: any, id: number) => {
      const scale = dragX.interpolate({
         inputRange: [-80, 0],
         outputRange: [1, 0],
         extrapolate: "clamp",
      });

      return (
         <RectButton style={[styles.deleteButton, { backgroundColor: themeColors.red }]} onPress={() => handleDelete(id)}>
            <View style={styles.deleteButtonInner}>
               <Text style={styles.deleteButtonText}>X</Text>
            </View>
         </RectButton>
      );
   };

   const renderExpenseItem = ({ item: source }: { item: ExpenseSource }) => (
      <Swipeable
         renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, source?.id)}
         overshootRight={false}
         onSwipeableOpen={() => source?.id && handleDelete(source.id)}>
         <TouchableOpacity
            style={[
               styles.expenseItem,
               {
                  borderColor: themeColors.frame_stroke,
                  backgroundColor: themeColors.page_background,
               },
            ]}>
            <View style={styles.expenseDetails}>
               <Text style={[styles.expenseTitle, { color: themeColors.card_title }]}>{source?.description || t("expense.untitled")}</Text>
               <Text style={[styles.expenseSubtext, { color: themeColors.card_title }]}>
                  {source?.isRecurring ? t("expense.periodic") : t("expense.oneTime")} •{source?.paymentMethod || t("expense.unknownMethod")} •
                  {/* Translate the category name */}
                  {t(`categories.${(source?.categoryName || "uncategorized").toLowerCase().replace(/\s+/g, "_")}`)}
               </Text>
            </View>
            <Text style={[styles.expenseAmount, { color: themeColors.red }]}>${source?.amount ? source.amount.toLocaleString() : "0"}</Text>
         </TouchableOpacity>
      </Swipeable>
   );

   const handleDelete = async (id: number) => {
      try {
         if (!id) {
            console.error("Cannot delete expense: Invalid ID");
            Alert.alert(t("alerts.titles.error"), t("alerts.error.invalidId"));
            return;
         }

         // Show a confirmation dialog before deletion
         Alert.alert(t("alert.deletionTitle"), t("alert.deletionMessage"), [
            { text: t("alert.cancel"), style: "cancel" },
            {
               text: t("alert.confirm"),
               style: "destructive",
               onPress: async () => {
                  try {
                     // Delete from API
                     await deleteExpense(id);

                     // Remove from local state
                     const deletedExpense = expenses.find((item) => item.id === id);
                     const remainingExpenses = expenses.filter((item) => item.id !== id);
                     setExpenses(remainingExpenses);

                     // Update transactions if needed
                     if (deletedExpense) {
                        setTransactions((prevTransactions) => {
                           // Filter out the transaction related to the deleted expense
                           const filteredTransactions = prevTransactions.filter((t) => t.source !== deletedExpense.description);

                           // If we now have less than 2 transactions and have more expenses,
                           // add another transaction from the remaining expenses
                           if (filteredTransactions.length < 2 && remainingExpenses.length > filteredTransactions.length) {
                              // Get expenses not already in the transactions list
                              const expensesForTransactions = remainingExpenses.filter(
                                 (e) => !filteredTransactions.some((t) => t.source === e.description)
                              );

                              if (expensesForTransactions.length > 0) {
                                 // Add the first one to the transactions
                                 filteredTransactions.push({
                                    date: new Date().toISOString().split("T")[0],
                                    source: expensesForTransactions[0].description,
                                    amount: expensesForTransactions[0].amount,
                                 });
                              }
                           }

                           return filteredTransactions;
                        });
                     }

                     // Update financial summary
                     try {
                        const updatedFinancialData = await getFinancialSummary();
                        setFinancialData(updatedFinancialData);
                     } catch (err) {
                        console.error("Failed to refresh financial data after deletion:", err);
                     }
                  } catch (error) {
                     console.error("Error deleting expense:", error);
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

   const handleAddExpense = async (newExpense: { description: string; amount: number; method: string; isRecurring: boolean; categoryId: number }) => {
      try {
         console.log("Adding new expense:", newExpense);

         // Validate inputs before sending to API
         if (!newExpense.description) {
            Alert.alert("Error", "Please enter a description");
            return;
         }

         if (!newExpense.amount || newExpense.amount <= 0) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
         }

         if (!newExpense.categoryId) {
            Alert.alert("Error", "Please select a category");
            return;
         }

         // Add expense using the API
         const newId = await addExpense({
            description: newExpense.description,
            amount: newExpense.amount,
            paymentMethod: newExpense.method || "Other", // Provide default if missing
            isRecurring: Boolean(newExpense.isRecurring),
            categoryId: newExpense.categoryId,
         });

         // Only proceed if we got a valid ID back
         if (newId) {
            // Create mapped expense for local state
            const mappedExpense: ExpenseSource = {
               id: newId,
               description: newExpense.description,
               amount: newExpense.amount,
               paymentMethod: newExpense.method || "Other",
               isRecurring: newExpense.isRecurring,
               categoryId: newExpense.categoryId,
               categoryName: categories.find((c) => c.id === newExpense.categoryId)?.name || "Unknown",
            };

            // Update states
            setExpenses((prev) => [...prev, mappedExpense]);
            updateTransactions(mappedExpense);

            // Refresh financial data
            try {
               const updatedFinancialData = await getFinancialSummary();
               setFinancialData(updatedFinancialData);
            } catch (err) {
               console.error("Failed to refresh financial data after adding expense:", err);
            }

            setIsAddModalVisible(false);
         }
      } catch (error: any) {
         console.error("Error adding expense:", {
            message: error.message,
            data: error.response?.data,
            status: error.response?.status,
         });

         // Show a more user-friendly error message
         Alert.alert("Error Adding Expense", error.message || "There was a problem adding your expense. Please try again.", [{ text: "OK" }]);
      }
   };

   const updateTransactions = (newExpense: ExpenseSource) => {
      // Create transaction from new expense
      const newTransaction: Transaction = {
         date: new Date().toISOString().split("T")[0],
         source: newExpense.description,
         amount: newExpense.amount,
      };

      // Update transactions list, keeping only 2 most recent
      setTransactions((prevTransactions) => {
         // Put new transaction at the beginning
         const updatedTransactions = [newTransaction];

         // Add the most recent previous transaction if it exists and is different
         if (prevTransactions.length > 0 && prevTransactions[0].source !== newTransaction.source) {
            updatedTransactions.push(prevTransactions[0]);
         }
         // If first one is the same, try the second one
         else if (prevTransactions.length > 1) {
            updatedTransactions.push(prevTransactions[1]);
         }

         // Return only 2 most recent transactions
         return updatedTransactions.slice(0, 2);
      });
   };

   // Add getSortedExpenses function
   const getSortedExpenses = (expenses: ExpenseSource[]) => {
      return [...expenses].sort((a, b) => {
         if (a.isRecurring && !b.isRecurring) return -1;
         if (b.isRecurring && !a.isRecurring) return 1;
         return 0;
      });
   };

   // Update your fetchExpenses function to support pagination
   const fetchExpenses = async (page = 1, shouldAppend = false) => {
      try {
         if (page === 1) {
            setLoading(true);
         } else {
            setIsLoadingMore(true);
         }

         // Use the updated getExpenses function that now includes pagination
         const response = await getExpenses(page, pageSize);

         const items = response.items || [];
         const mappedExpenses = items.map((expense: any) => ({
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            paymentMethod: expense.paymentMethod,
            isRecurring: expense.isRecurring,
            categoryId: expense.categoryId,
            categoryName: expense.categoryName,
         }));

         // Check if we have more data to load
         setHasMoreData(response.hasNextPage ?? false);

         // Update the current page
         setCurrentPage(page);

         // Either replace or append the data
         if (shouldAppend) {
            setExpenses((prev) => [...prev, ...mappedExpenses]);
         } else {
            setExpenses(mappedExpenses);
         }

         // Only update transactions if this is the first page and we have data
         if (mappedExpenses.length > 0 && page === 1) {
            // Get up to 2 most recent expenses
            const recentExpenses = mappedExpenses.slice(0, 2);

            // Create transactions from these expenses
            const newTransactions = recentExpenses.map((expense) => ({
               date: new Date().toISOString().split("T")[0],
               source: expense.description,
               amount: expense.amount,
            }));

            setTransactions(newTransactions);
         }
      } catch (error) {
         console.error("Failed to fetch expenses:", error);
         Alert.alert(t("alerts.titles.error"), t("alerts.error.failedToLoad"));
         setHasMoreData(false);
      } finally {
         setLoading(false);
         setIsLoadingMore(false);
      }
   };

   // Add these handler functions for loading more data
   const handleLoadMore = () => {
      if (!isLoadingMore && hasMoreData) {
         fetchExpenses(currentPage + 1, true);
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
         <View style={styles.headerSection}>
            <SideDrawer isDarkMode={isDarkMode} onNavigate={handleNavigate} currentRoute="Expenses" />
         </View>
         {financialData && (
            <>
               <DashboardCarousel isDarkMode={isDarkMode} data={transformFinancialData(financialData, isDarkMode)} />
            </>
         )}
         <View style={styles.content}>
            {/* Expense Sources Section */}
            <View
               style={[
                  styles.card,
                  {
                     backgroundColor: themeColors.page_background,
                     borderColor: themeColors.frame_stroke,
                  },
               ]}>
               <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: themeColors.card_title }]}>{t("expenseSources")}</Text>
                  <TouchableOpacity
                     style={[
                        styles.addButton,
                        {
                           borderColor: themeColors.frame_stroke,
                           backgroundColor: themeColors.page_background,
                           opacity: categories.length > 0 ? 1 : 0.5,
                        },
                     ]}
                     disabled={categories.length === 0}
                     onPress={() => {
                        if (categories.length > 0) {
                           setIsAddModalVisible(true);
                        }
                     }}>
                     <Text style={[styles.addButtonText, { color: themeColors.card_title }]}>+</Text>
                  </TouchableOpacity>
               </View>

               <FlatList
                  data={getSortedExpenses(expenses)}
                  renderItem={renderExpenseItem}
                  keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={pageSize}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                  getItemLayout={(data, index) => ({
                     length: 80, // Approximate height of each item
                     offset: 85 * index,
                     index,
                  })}
                  style={styles.expenseList}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={renderFooter}
                  refreshing={loading}
                  //onRefresh={() => fetchExpenses(1, false)}
               />
            </View>

            {/* Recent Transactions Section */}
            <View style={[styles.transactionCard, { backgroundColor: themeColors.page_background }, { borderColor: themeColors.frame_stroke }]}>
               <Text style={[styles.cardTitle, { color: themeColors.card_title }]}>{t("recentTransactions")}</Text>
               {transactions.map((transaction) => (
                  <View
                     key={`${transaction.date}-${transaction.source}-${transaction.amount}`}
                     style={[
                        styles.transactionItem,
                        {
                           borderColor: themeColors.frame_stroke,
                           backgroundColor: themeColors.page_background,
                        },
                     ]}>
                     <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionDate, { color: themeColors.card_title }]}>{transaction.date}</Text>
                        <Text style={[styles.transactionSource, { color: themeColors.card_title }]}>{transaction.source}</Text>
                     </View>
                     <Text style={[styles.transactionAmount, { color: themeColors.card_title }]}>${transaction.amount}</Text>
                  </View>
               ))}
            </View>
         </View>
         {categories.length > 0 && (
            <AddExpenseModal
               visible={isAddModalVisible}
               onClose={() => setIsAddModalVisible(false)}
               onAdd={handleAddExpense}
               isDarkMode={isDarkMode}
               categories={categories} // These should be the categories from your API
            />
         )}
      </View>
   );
};

export default ExpenseScreen;

const styles = StyleSheet.create({
   container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
   },
   headerSection: {
      width: "100%",
      paddingHorizontal: 20,
      paddingVertical: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 10,
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
   content: {
      flex: 1,
      width: "100%",
      paddingHorizontal: horizontalScale(16),
   },
   card: {
      borderRadius: moderateScale(24),
      padding: moderateScale(16),
      marginBottom: verticalScale(10),
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: verticalScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: moderateScale(8),
      borderWidth: 1,
      minHeight: verticalScale(320),
   },
   transactionCard: {
      borderRadius: moderateScale(24),
      padding: moderateScale(16),
      marginBottom: verticalScale(10),
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: verticalScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: moderateScale(8),
      borderWidth: 1,
      minHeight: verticalScale(157),
   },
   cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(8),
   },
   cardTitle: {
      fontSize: moderateScale(20),
      fontWeight: "600",
      color: "#333",
   },
   addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",

      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      borderWidth: 1,
   },
   addButtonText: {
      fontSize: moderateScale(24),
      fontWeight: "400",
   },
   expenseList: {
      maxHeight: verticalScale(240), // Height for 3 items (85 * 3)
   },
   expenseItem: {
      height: verticalScale(85),
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: verticalScale(16),
      paddingHorizontal: horizontalScale(12),
      backgroundColor: "white",
      borderRadius: moderateScale(16),
      marginBottom: verticalScale(5),
      borderWidth: 1,
   },
   expenseDetails: {
      flex: 1,
      justifyContent: "center",
   },
   expenseTitle: {
      fontSize: moderateScale(18),
      fontWeight: "600",
      marginBottom: verticalScale(4),
   },
   expenseSubtext: {
      fontSize: moderateScale(14),
      opacity: 0.7,
   },
   expenseAmount: {
      fontSize: moderateScale(20),
      fontWeight: "600",
      color: "#2ecc71",
   },
   transactionItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: verticalScale(10),
      paddingHorizontal: horizontalScale(24),
      borderRadius: moderateScale(20),
      borderWidth: 1,

      marginTop: verticalScale(5),
   },
   transactionInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
   },
   transactionDate: {
      fontSize: 16,
      fontWeight: "500",
      marginRight: 5,
   },
   transactionSource: {
      fontSize: 16,
      fontWeight: "500",

      marginRight: 5,
   },
   transactionAmount: {
      fontSize: 16,
      fontWeight: "600",
   },
   deleteButton: {
      width: 80,
      height: "90%",
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
   footerLoader: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      padding: moderateScale(10),
      height: verticalScale(50),
   },
});
