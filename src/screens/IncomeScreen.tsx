import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { getThemeColors } from "../utils/getThemeColors";
import ConfirmationModal, { ModalButton } from "../../components/ConfirmationModal";
import ScreenHeader from "../../components/ScreenHeader";
import {
  addIncome,
  updateIncome,
  getIncomes,
  deleteIncome,
  getFinancialSummary,
} from "../services/api";
import AddIncomeModal from "../../components/AddIncomeModal";
import UpdateIncomeModal from "../../components/UpdateIncomeModal";
import { useTranslation } from "react-i18next";
import type { FinancialSummary } from "../services/api";
import { transformFinancialData } from "../utils/transformFinancialData";
import DashboardCarousel from "../../components/DashboardCarousel";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../utils/scaling";
import ActionFAB from "../../components/ActionFAB";
import { usePrivacy } from "../context/PrivacyContext";
import { getCurrencySymbol } from "../utils/currencyUtils";
import { useUser } from "../context/UserContext";

interface IncomeScreenProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  navigation: any;
}

interface IncomeSource {
  id: number;
  title: string;
  amount: number;
  type: string;
  paymentMethod: string;
  currency?: string;
  addedAt?: string;
  transactionDate?: string;
}

interface Transaction {
  date: string;
  source: string;
  amount: number;
  currency?: string;
}

const IncomeScreen: React.FC<IncomeScreenProps> = ({
  isDarkMode,
  onToggleTheme,
  navigation,
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const { isPrivacyMode } = usePrivacy();
  const { preferredCurrency } = useUser();
  const { t } = useTranslation();
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<IncomeSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
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
  const pageSize = 10;

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
    fetchIncomeData();
  }, [preferredCurrency]);

  useEffect(() => {
    // Update transactions whenever incomeSources changes
    if (incomeSources.length > 0) {
      // Get the 2 most recent income sources by addedAt timestamp
      const recentIncomes = getMostRecentIncomes(incomeSources, 2);

      // Map to transaction format
      const newTransactions = recentIncomes.map((income) => ({
        date: new Date().toISOString().split("T")[0],
        source: income.title,
        amount: income.amount,
        currency: income.currency,
      }));

      setTransactions(newTransactions);
    }
  }, [incomeSources]); // This runs whenever incomeSources changes

  const fetchIncomeData = async (page = 1, shouldAppend = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Fetch income data using the new API function with current page
      const response = await getIncomes(page, pageSize, preferredCurrency);

      // Map the response data to your local format with timestamps
      const incomes = response.items || [];
      const mappedIncomes = incomes.map((income: any, index: number) => ({
        id: income.id,
        title: income.name,
        amount: income.amount,
        type: income.isRecurring ? "Periodic" : "One-time",
        paymentMethod: income.method,
        currency: income.currency,
        transactionDate: income.transactionDate,
        // Use a fake timestamp to simulate recency for existing items
        // Each item gets a timestamp 1 minute apart, with newer items being more recent
        addedAt: new Date(Date.now() - index * 60000).toISOString(),
      }));

      // Check if we have more data to load
      setHasMoreData(response.hasNextPage ?? false);

      // Update the current page
      setCurrentPage(page);

      // Either replace or append the data
      if (shouldAppend) {
        setIncomeSources((prev) => [...prev, ...mappedIncomes]);
      } else {
        setIncomeSources(mappedIncomes);
      }

      // Only set initial transactions if we don't have any and it's the first page
      if (mappedIncomes.length > 0 && page === 1) {
        // Get the 2 most recent incomes by addedAt timestamp
        const recentIncomes = getMostRecentIncomes(mappedIncomes, 2);

        // Create new transactions from these incomes
        const newTransactions = recentIncomes.map((income) => ({
          date: new Date().toISOString().split("T")[0],
          source: income.title,
          amount: income.amount,
          currency: income.currency,
        }));

        setTransactions(newTransactions);
      }

      // Also fetch financial summary if needed
      if (page === 1) {
        const financialSummaryData = await getFinancialSummary(preferredCurrency);
        setFinancialData(financialSummaryData);
      }
    } catch (error) {
      console.error("Error fetching income data:", error);
      showAlert(t("common.error") || "Error", t("income.loadError") || "Failed to load income data. Please try again.", "error");
      setHasMoreData(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const updateRecentTransactions = (newIncome: IncomeSource) => {
    // Create a new transaction for the newly added income
    const newTransaction = {
      date: new Date().toISOString().split("T")[0],
      source: newIncome.title,
      amount: newIncome.amount,
      currency: newIncome.currency,
    };

    // Always put the new transaction first
    setTransactions([newTransaction, ...transactions.slice(0, 1)].slice(0, 2));
  };

  const handleAddIncome = async (newIncome: {
    name: string;
    amount: number;
    method: string;
    isRecurring: boolean;
    currency?: string;
  }) => {
    try {
      // Add income using the API
      const newId = await addIncome({
        name: newIncome.name,
        amount: newIncome.amount,
        method: newIncome.method,
        isRecurring: newIncome.isRecurring,
      });

      // Create mapped income object with timestamp
      const mappedIncome: IncomeSource = {
        id: newId,
        title: newIncome.name,
        amount: newIncome.amount,
        type: newIncome.isRecurring ? "Periodic" : "One-time",
        paymentMethod: newIncome.method,
        currency: newIncome.currency,
        addedAt: new Date().toISOString(), // Add timestamp for tracking recency
      };

      // Keep your existing sorting logic for the list
      setIncomeSources((prevIncomes) => {
        // Add the new income to the array
        const updatedIncomes = [mappedIncome, ...prevIncomes];
        // Sort by type as before (periodic first)
        return getSortedIncomeSources(updatedIncomes);
      });

      // Update transactions to show the new income in recent transactions
      // This function now uses the most recently added items
      updateRecentTransactions(mappedIncome);

      // Optionally, update financial summary in background without full page reload
      getFinancialSummary(preferredCurrency)
        .then((updatedData) => {
          setFinancialData(updatedData);
        })
        .catch((err) => {
          console.error("Failed to update financial summary:", err);
        });

      // Close the modal
      setIsAddModalVisible(false);
      showAlert(t("common.success") || "Success", t("income.added") || "Income added successfully", "success");
    } catch (error) {
      console.error("Error adding income:", error);
      showAlert(t("common.error") || "Error", t("alert.failedtoAdd") || "Failed to add income", "error");
    }
  };

  const handleDeleteIncome = async (id: number) => {
    try {
      if (!id) {
        console.error("Cannot delete income: Invalid ID");
        return;
      }

      // Show a confirmation dialog before deletion
      showAlert(
        t("alert.deletionTitle") || "Delete Income",
        t("alert.deletionMessage") || "Are you sure you want to delete this income?",
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
                await deleteIncome(id);

                // Remove from local state
                const remainingIncomes = incomeSources.filter(
                  (source) => source.id !== id,
                );
                setIncomeSources(remainingIncomes);

                // Get up to 2 most recent remaining incomes for transactions
                const recentRemainingIncomes = remainingIncomes.slice(0, 2);
                setTransactions(
                  recentRemainingIncomes.map((income) => ({
                    date: new Date().toISOString().split("T")[0],
                    source: income.title,
                    amount: income.amount,
                    currency: income.currency,
                  })),
                );

                // Update financial summary in the background
                getFinancialSummary(preferredCurrency)
                  .then((updatedData) => {
                    setFinancialData(updatedData);
                  })
                  .catch((err) => {
                    console.error(
                      "Failed to update financial summary after deletion:",
                      err,
                    );
                  });
              } catch (error) {
                console.error("Error deleting income:", error);
                showAlert(
                  t("alert.genericErrorTitle") || "Error",
                  t("alert.failedtoDelete") || "Failed to delete income",
                  "error"
                );
              }
            },
            type: "confirm",
            color: themeColors.red
          }
        ]
      );
    } catch (error) {
      console.error("Error in handleDeleteIncome:", error);
      showAlert(t("common.error") || "Error", "An unexpected error occurred. Please try again.", "error");
    }
  };

  const renderRightActions = (progress: any, dragX: any, id: number) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <RectButton
        style={[styles.deleteButton, { backgroundColor: themeColors.red }]}
        onPress={() => handleDeleteIncome(id)}
      >
        <View style={styles.deleteButtonInner}>
          <Text style={styles.deleteButtonText}>X</Text>
        </View>
      </RectButton>
    );
  };

  const renderIncomeItem = ({ item: source }: { item: IncomeSource }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, source?.id)
      }
      overshootRight={false}
      onSwipeableOpen={() => source?.id && handleDeleteIncome(source.id)}
    >
      <TouchableOpacity
        style={[
          styles.incomeItem,
          {
            borderColor: themeColors.frame_stroke,
            backgroundColor: themeColors.card_background,
          },
        ]}
        onPress={() => {
          setSelectedIncome(source);
          setIsUpdateModalVisible(true);
        }}
      >
        <View style={styles.incomeDetails}>
          <Text style={[styles.incomeTitle, { color: themeColors.card_title }]}>
            {source?.title || "Untitled"}
          </Text>
          <Text
            style={[styles.incomeSubtext, { color: themeColors.card_title }]}
          >
            {source?.type === "Periodic" ? t("periodic") : t("oneTime")} •{" "}
            {source?.paymentMethod || t("income.unknownMethod")}
          </Text>
        </View>
        <Text style={[styles.incomeAmount, { color: themeColors.green }]}>
          {isPrivacyMode ? "****" : `${getCurrencySymbol(preferredCurrency || source?.currency)}${typeof source?.amount === "number" ? source.amount : "0"}`}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );

  const getSortedIncomeSources = (sources: IncomeSource[]) => {
    return [...sources].sort((a, b) => {
      if (a.type === "Periodic" && b.type !== "Periodic") return -1;
      if (b.type === "Periodic" && a.type !== "Periodic") return 1;
      return 0;
    });
  };

  const getMostRecentIncomes = (
    sources: IncomeSource[],
    count: number = 2,
  ): IncomeSource[] => {
    // Create a copy to avoid modifying the original array
    return [...sources]
      .sort((a, b) => {
        // Sort by addedAt if available
        if (a.addedAt && b.addedAt) {
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        }
        // Otherwise, assume newer items are at the beginning of the array
        return 0;
      })
      .slice(0, count);
  };

  const handleUpdateIncome = async (id: number, updatedIncome: {
    name: string;
    amount: number;
    method: string;
    isRecurring: boolean;
    transactionDate: string;
  }) => {
    try {
      setLoading(true);
      await updateIncome(id, {
        name: updatedIncome.name,
        amount: updatedIncome.amount,
        method: updatedIncome.method,
        isRecurring: updatedIncome.isRecurring,
        transactionDate: updatedIncome.transactionDate,
        currency: preferredCurrency,
      });

      // Update local state
      setIncomeSources((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                title: updatedIncome.name,
                amount: updatedIncome.amount,
                paymentMethod: updatedIncome.method,
                type: updatedIncome.isRecurring ? "Periodic" : "One-time",
                transactionDate: updatedIncome.transactionDate,
              }
            : i
        )
      );

      // Refresh financial data
      const finData = await getFinancialSummary(preferredCurrency);
      setFinancialData(finData);

      setIsUpdateModalVisible(false);
      setSelectedIncome(null);
      showAlert(t("common.success") || "Success", t("income.updated") || "Income updated successfully", "success");
    } catch (error: any) {
      console.error("Error updating income:", error);
      showAlert(
        t("common.error") || "Error",
        error.message || t("income.updateFailed") || "Failed to update income",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreData) {
      fetchIncomeData(currentPage + 1, true);
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={themeColors.green} />
          {t("common.loadingMore")}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.green} />
        <Text style={{ color: themeColors.card_title, marginTop: 10 }}>{t("common.loadingIncomes")}</Text>
      </View>
    );
  }

  function handleNavigate(screen: string): void {
    navigation.navigate(screen);
  }

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
        currentRoute="Income"
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
        {/* Income Sources Section */}
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
              {t("incomeSources")}
            </Text>
          </View>

          <FlatList
            data={getSortedIncomeSources(incomeSources)}
            renderItem={renderIncomeItem}
            keyExtractor={(item, index) => {
              if (item && item.id !== undefined) {
                return item.id.toString();
              }
              return index.toString(); // Fallback to index if id is undefined
            }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            getItemLayout={(data, index) => ({
              length: 80, // Approximate height of each item
              offset: 85 * index,
              index,
            })}
            style={styles.incomeList}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshing={loading}
            //onRefresh={() => fetchIncomeData(1, false)}
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
      <AddIncomeModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAdd={handleAddIncome}
        isDarkMode={isDarkMode}
      />
      <UpdateIncomeModal
        visible={isUpdateModalVisible}
        onClose={() => {
          setIsUpdateModalVisible(false);
          setSelectedIncome(null);
        }}
        onUpdate={handleUpdateIncome}
        isDarkMode={isDarkMode}
        initialIncome={selectedIncome ? {
          id: selectedIncome.id,
          name: selectedIncome.title,
          amount: selectedIncome.amount,
          method: selectedIncome.paymentMethod,
          isRecurring: selectedIncome.type === "Periodic",
          transactionDate: selectedIncome.transactionDate || new Date().toISOString()
        } : null}
      />
      <ActionFAB
        isDarkMode={isDarkMode}
        onPress={() => setIsAddModalVisible(true)}
      />

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

export default IncomeScreen;

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
    fontSize: 24,
    fontWeight: "400",
  },
  incomeList: {
    maxHeight: 240, // Height for 3 items (85 * 3)
  },
  incomeItem: {
    height: 85,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 5,
    borderWidth: 1,
  },
  incomeDetails: {
    flex: 1,
    justifyContent: "center",
  },
  incomeTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  incomeSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  incomeAmount: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2ecc71",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,

    marginTop: 5,
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
    padding: 10,
    height: 50,
  },
});
