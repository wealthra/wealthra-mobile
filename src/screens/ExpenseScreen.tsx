import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { getThemeColors } from "../utils/getThemeColors";
import ConfirmationModal, { ModalButton } from "../../components/ConfirmationModal";
import {
  getExpenses,
  deleteExpense,
  addExpense,
  getUserCategories,
  getStoredUserId,
  bulkAddExpenses,
  extractExpenseFromImage,
  extractExpenseFromAudio,
  type ExpenseDto,
} from "../services/api";
import * as ImagePicker from "expo-image-picker";
import VoiceRecordingModal from "../../components/VoiceRecordingModal";
import ResultReviewModal from "../../components/ResultReviewModal";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../components/ScreenHeader";
import type { FinancialSummary } from "../services/api";
import { transformFinancialData } from "../utils/transformFinancialData";
import DashboardCarousel from "../../components/DashboardCarousel";
import { getFinancialSummary } from "../services/api";
import AddExpenseModal from "../../components/AddExpenseModal";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import axios from "axios";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../utils/scaling";
import ActionFAB from "../../components/ActionFAB";
import { usePrivacy } from "../context/PrivacyContext";
import { getCurrencySymbol } from "../utils/currencyUtils";
import { useUser } from "../context/UserContext";

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
  currency?: string;
}

interface ExpenseCategory {
  id: number;
  name: string;
}

interface Transaction {
  date: string;
  source: string;
  amount: number;
  currency?: string;
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

const ExpenseScreen: React.FC<ExpenseScreenProps> = ({
  isDarkMode,
  onToggleTheme,
  navigation,
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const { isPrivacyMode } = usePrivacy();
  const { preferredCurrency, refreshUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(
    null,
  );
  const [expenses, setExpenses] = useState<ExpenseSource[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [extractedExpenses, setExtractedExpenses] = useState<ExpenseDto[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const pageSize = 10;
  const { t, i18n } = useTranslation();

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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch categories first
        await fetchCategories();

        const [finData] = await Promise.all([getFinancialSummary(preferredCurrency)]);

        setFinancialData(finData);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [preferredCurrency]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);

        // Use the updated getExpenses function that now includes userId in the path
        const response = await getExpenses(1, 10, preferredCurrency);

        const items = response.items || [];
        const mappedExpenses = items.map((expense: any) => ({
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          paymentMethod: expense.paymentMethod,
          isRecurring: expense.isRecurring,
          categoryId: expense.categoryId,
          categoryName: expense.categoryName,
          currency: expense.currency,
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
              currency: expense.currency,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [preferredCurrency]);

  const handleScanReceipt = async () => {
    showAlert(
      t("scan.title") || "Scan Receipt",
      t("scan.message") || "Choose a source",
      "info",
      undefined,
      [
        {
          text: t("scan.camera") || "Camera",
          onPress: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            processImage(ImagePicker.launchCameraAsync);
          },
          type: "confirm"
        },
        {
          text: t("scan.gallery") || "Gallery",
          onPress: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            processImage(ImagePicker.launchImageLibraryAsync);
          },
          type: "confirm"
        },
        {
          text: t("common.cancel") || "Cancel",
          onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })),
          type: "cancel"
        },
      ]
    );
  };

  const processImage = async (launcher: typeof ImagePicker.launchCameraAsync) => {
    try {
      const result = await launcher({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsExtracting(true);
        const asset = result.assets[0];
        const expensesData = await extractExpenseFromImage(
          asset.uri,
          asset.mimeType || "image/jpeg",
          asset.fileName || "receipt.jpg",
        );
        setExtractedExpenses(expensesData);
        setIsReviewModalVisible(true);
      }
    } catch (error) {
      console.error("Image processing error:", error);
      showAlert(t("common.error") || "Error", t("scan.error") || "Failed to process receipt image", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVoiceRecordingComplete = async (uri: string) => {
    setIsVoiceModalVisible(false);
    setIsExtracting(true);
    try {
      const expensesData = await extractExpenseFromAudio(uri, "audio/mpeg", "voice-expense.mp3");
      setExtractedExpenses(expensesData);
      setIsReviewModalVisible(true);
    } catch (error) {
      console.error("Voice processing error:", error);
      showAlert(t("common.error") || "Error", t("voice.error") || "Failed to process voice command", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmBulkAdd = async (expensesToAdd: ExpenseDto[]) => {
    if (expensesToAdd.length === 0) {
      setIsReviewModalVisible(false);
      return;
    }

    try {
      setIsExtracting(true);
      const commands = expensesToAdd.map((e) => ({
        description: e.description,
        amount: e.amount,
        paymentMethod: e.paymentMethod,
        isRecurring: e.isRecurring,
        categoryId: e.categoryId,
        transactionDate: e.transactionDate,
      }));

      await bulkAddExpenses(commands);
      setIsReviewModalVisible(false);

      // Refresh data
      fetchExpenses(1, false);
      const finData = await getFinancialSummary();
      setFinancialData(finData);

      showAlert(t("common.success") || "Success", `${t("expense.addedCount", { count: expensesToAdd.length }) || `Added ${expensesToAdd.length} expenses`}`, "success");
    } catch (error) {
      console.error("Bulk add error:", error);
      showAlert(t("common.error") || "Error", t("expense.addFailed") || "Failed to add expenses", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getUserCategories();
      const currentLang = i18n.language as "en" | "tr";

      if (response && response.length > 0) {
        setCategories(
          response.map((category: any) => ({
            id: category.id,
            name: category.name || category.categoryName || "Miscellaneous",
          })),
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
      <RectButton
        style={[styles.deleteButton, { backgroundColor: themeColors.red }]}
        onPress={() => handleDelete(id)}
      >
        <View style={styles.deleteButtonInner}>
          <Text style={styles.deleteButtonText}>X</Text>
        </View>
      </RectButton>
    );
  };

  const renderExpenseItem = ({ item: source }: { item: ExpenseSource }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, source?.id)
      }
      overshootRight={false}
      onSwipeableOpen={() => source?.id && handleDelete(source.id)}
    >
      <TouchableOpacity
        style={[
          styles.expenseItem,
          {
            borderColor: themeColors.frame_stroke,
            backgroundColor: themeColors.card_background,
          },
        ]}
      >
        <View style={styles.expenseDetails}>
          <Text
            style={[styles.expenseTitle, { color: themeColors.card_title }]}
          >
            {source?.description || t("expense.untitled")}
          </Text>
          <Text
            style={[styles.expenseSubtext, { color: themeColors.card_title }]}
          >
            {source?.isRecurring ? t("expense.periodic") : t("expense.oneTime")}{" "}
            •{source?.paymentMethod || t("expense.unknownMethod")} •
            {/* Translate the category name */}
            {t(
              `categories.${(source?.categoryName || "miscellaneous").toLowerCase().replace(/\s+/g, "_")}`,
            )}
          </Text>
        </View>
        <Text style={[styles.expenseAmount, { color: themeColors.red }]}>
          {isPrivacyMode ? "****" : `${getCurrencySymbol(preferredCurrency || source?.currency)}${source?.amount ? source.amount.toLocaleString() : "0"}`}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );

  const handleDelete = async (id: number) => {
    try {
      if (!id) {
        console.error("Cannot delete expense: Invalid ID");
        showAlert(t("alerts.titles.error") || "Error", t("alerts.error.invalidId") || "Invalid ID", "error");
        return;
      }

      // Show a confirmation dialog before deletion
      showAlert(
        t("alert.deletionTitle") || "Delete Expense",
        t("alert.deletionMessage") || "Are you sure you want to delete this expense?",
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
                await deleteExpense(id);

              // Remove from local state
              const deletedExpense = expenses.find((item) => item.id === id);
              const remainingExpenses = expenses.filter(
                (item) => item.id !== id,
              );
              setExpenses(remainingExpenses);

              // Update transactions if needed
              if (deletedExpense) {
                setTransactions((prevTransactions) => {
                  // Filter out the transaction related to the deleted expense
                  const filteredTransactions = prevTransactions.filter(
                    (t) => t.source !== deletedExpense.description,
                  );

                  // If we now have less than 2 transactions and have more expenses,
                  // add another transaction from the remaining expenses
                  if (
                    filteredTransactions.length < 2 &&
                    remainingExpenses.length > filteredTransactions.length
                  ) {
                    // Get expenses not already in the transactions list
                    const expensesForTransactions = remainingExpenses.filter(
                      (e) =>
                        !filteredTransactions.some(
                          (t) => t.source === e.description,
                        ),
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
                const updatedFinancialData = await getFinancialSummary(preferredCurrency);
                setFinancialData(updatedFinancialData);
              } catch (err) {
                console.error(
                  "Failed to refresh financial data after deletion:",
                  err,
                );
              }
            } catch (error) {
              console.error("Error deleting expense:", error);
              showAlert(
                t("alert.genericErrorTitle") || "Error",
                t("alert.failedToDelete") || "Failed to delete expense",
                "error"
              );
            }
          },
          type: "confirm",
          color: themeColors.red
        },
      ]);
    } catch (error) {
      console.error("Error in handleDelete:", error);
      showAlert(t("alerts.titles.error") || "Error", t("alerts.error.generic") || "An unexpected error occurred.", "error");
    }
  };

  const handleAddExpense = async (newExpense: {
    description: string;
    amount: number;
    method: string;
    isRecurring: boolean;
    categoryId: number;
    currency?: string;
  }) => {
    try {
      console.log("Adding new expense:", newExpense);

      // Validate inputs before sending to API
      if (!newExpense.description) {
        showAlert(t("common.error") || "Error", t("expense.errorDescription") || "Please enter a description", "error");
        return;
      }

      if (!newExpense.amount || newExpense.amount <= 0) {
        showAlert(t("common.error") || "Error", t("expense.errorAmount") || "Please enter a valid amount", "error");
        return;
      }

      if (!newExpense.categoryId) {
        showAlert(t("common.error") || "Error", t("expense.errorCategory") || "Please select a category", "error");
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
          categoryName:
            categories.find((c) => c.id === newExpense.categoryId)?.name ||
            "Unknown",
        };

        // Update states
        setExpenses((prev) => [...prev, mappedExpense]);
        updateTransactions(mappedExpense);

        // Refresh financial data
        try {
          const updatedFinancialData = await getFinancialSummary(preferredCurrency);
          setFinancialData(updatedFinancialData);
        } catch (err) {
          console.error(
            "Failed to refresh financial data after adding expense:",
            err,
          );
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
      showAlert(
        t("expense.errorAddTitle") || "Error Adding Expense",
        error.message ||
          (t("expense.errorAddMessage") || "There was a problem adding your expense. Please try again."),
        "error"
      );
    }
  };

  const updateTransactions = (newExpense: ExpenseSource) => {
    // Create transaction from new expense
    const newTransaction: Transaction = {
      date: new Date().toISOString().split("T")[0],
      source: newExpense.description,
      amount: newExpense.amount,
      currency: newExpense.currency,
    };

    // Update transactions list, keeping only 2 most recent
    setTransactions((prevTransactions) => {
      // Put new transaction at the beginning
      const updatedTransactions = [newTransaction];

      // Add the most recent previous transaction if it exists and is different
      if (
        prevTransactions.length > 0 &&
        prevTransactions[0].source !== newTransaction.source
      ) {
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
      const response = await getExpenses(page, pageSize, preferredCurrency);

      const items = response.items || [];
      const mappedExpenses = items.map((expense: any) => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        paymentMethod: expense.paymentMethod,
        isRecurring: expense.isRecurring,
        categoryId: expense.categoryId,
        categoryName: expense.categoryName,
        currency: expense.currency,
      }));

      // Check if we have more data to load
      setHasMoreData(response.hasNextPage ?? false);

      // Update the current page
      setCurrentPage(page);

      // Either replace or append the data
      if (shouldAppend) {
        setExpenses((prev) => {
          // Filter out items that are already in the list to avoid duplicate key errors
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = mappedExpenses.filter(
            (item) => !existingIds.has(item.id),
          );
          return [...prev, ...newItems];
        });
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
          currency: expense.currency,
        }));

        setTransactions(newTransactions);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      showAlert(t("alerts.titles.error") || "Error", t("alerts.error.failedToLoad") || "Failed to load expenses", "error");
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
        <Text style={{ color: themeColors.card_title, marginLeft: 8 }}>
          {t("common.loadingMore")}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.page_background },
      ]}
    >
      <ScreenHeader
        isDarkMode={isDarkMode}
        onNavigate={handleNavigate}
        currentRoute="Expenses"
      />
      {financialData && (
        <>
          <DashboardCarousel
            isDarkMode={isDarkMode}
            data={transformFinancialData(financialData, isDarkMode, isPrivacyMode, preferredCurrency)}
          />
        </>
      )}
      <View style={styles.content}>
        {/* Expense Sources Section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.card_background,
              borderColor: themeColors.frame_stroke,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: themeColors.card_title }]}>
              {t("expenseSources")}
            </Text>
          </View>

          <FlatList
            data={getSortedExpenses(expenses)}
            renderItem={renderExpenseItem}
            keyExtractor={(item) =>
              item?.id?.toString() || Math.random().toString()
            }
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
        <View
          style={[
            styles.transactionCard,
            { backgroundColor: themeColors.card_background },
            { borderColor: themeColors.frame_stroke },
          ]}
        >
          <Text style={[styles.cardTitle, { color: themeColors.card_title }]}>
            {t("recentTransactions")}
          </Text>
          {transactions.map((transaction) => (
            <View
              key={`${transaction.date}-${transaction.source}-${transaction.amount}`}
              style={[
                styles.transactionItem,
                {
                  borderColor: themeColors.frame_stroke,
                  backgroundColor: themeColors.card_background,
                },
              ]}
            >
              <View style={styles.transactionInfo}>
                <Text
                  style={[
                    styles.transactionDate,
                    { color: themeColors.card_title },
                  ]}
                >
                  {transaction.date}
                </Text>
                <Text
                  style={[
                    styles.transactionSource,
                    { color: themeColors.card_title },
                  ]}
                >
                  {transaction.source}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: themeColors.card_title },
                ]}
              >
                {isPrivacyMode ? "****" : `${getCurrencySymbol(preferredCurrency || transaction.currency)}${transaction.amount}`}
              </Text>
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
      <ActionFAB
        isDarkMode={isDarkMode}
        actions={[
          {
            label: t("fab.manualExpense") || "Manual Expense",
            icon: "plus",
            onPress: () => {
              if (categories.length > 0) {
                setIsAddModalVisible(true);
              } else {
                showAlert(t("common.error") || "Error", t("categories.loadingError") || "Please wait for categories to load", "warning");
              }
            },
            color: themeColors.green,
          },
          {
            label: t("fab.voice") || "Voice Input",
            icon: "microphone",
            onPress: () => setIsVoiceModalVisible(true),
          },
          {
            label: t("fab.scan") || "Scan Receipt",
            icon: "camera",
            onPress: handleScanReceipt,
          },
        ]}
      />
      <VoiceRecordingModal
        visible={isVoiceModalVisible}
        onClose={() => setIsVoiceModalVisible(false)}
        onRecordingComplete={handleVoiceRecordingComplete}
        isDarkMode={isDarkMode}
      />
      <ResultReviewModal
        visible={isReviewModalVisible}
        expenses={extractedExpenses}
        onConfirm={handleConfirmBulkAdd}
        onCancel={() => setIsReviewModalVisible(false)}
        isDarkMode={isDarkMode}
        categories={categories}
      />
      {isExtracting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={themeColors.green} />
          <Text style={[styles.loadingText, { color: "white" }]}>
            {t("common.extracting") || "Processing..."}
          </Text>
        </View>
      )}
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

export default ExpenseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
});
