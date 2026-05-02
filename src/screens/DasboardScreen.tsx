import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image } from "react-native";
import { getThemeColors } from "../utils/getThemeColors";
import SavingGoalSummary from "../../components/SavingGoalSummary";
import DashboardCarousel from "../../components/DashboardCarousel";
import SpendingChart from "../../components/SpendingChart";
import {
  addExpense,
  addIncome,
  getUserCategories,
  getFinancialSummary,
  getGoals,
  getCurrentUser,
  bulkAddExpenses,
  extractExpenseFromImage,
  extractExpenseFromAudio,
  getActiveAnnouncements,
  type FinancialDashboardDto,
  type GoalHistoryDto,
  type UserDto,
  type CategoryDto,
  type ExpenseDto,
  type AnnouncementDto,
} from "../services/api";
import * as ImagePicker from "expo-image-picker";
import VoiceRecordingModal from "../../components/VoiceRecordingModal";
import ResultReviewModal from "../../components/ResultReviewModal";
import AnnouncementModal from "../../components/AnnouncementModal";
import { transformFinancialData } from "../utils/transformFinancialData";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../components/ScreenHeader";
import AddExpenseModal from "../../components/AddExpenseModal";
import AddIncomeModal from "../../components/AddIncomeModal";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../utils/scaling";
import ActionFAB from "../../components/ActionFAB";
import { getCategoryColor } from "../utils/getCategoryColor";
import { usePrivacy } from "../context/PrivacyContext";
import { useUser } from "../context/UserContext";
import { useFocusEffect } from "@react-navigation/native";

interface DashboardScreenProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  navigation: any;
}

function DashboardScreen({
  isDarkMode,
  onToggleTheme,
  navigation,
}: DashboardScreenProps) {
  const themeColors = getThemeColors(isDarkMode);
  const { isPrivacyMode } = usePrivacy();
  const { preferredCurrency, refreshUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] =
    useState<FinancialDashboardDto | null>(null);
  const [userInfo, setUserInfo] = useState<UserDto | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [goalsSummary, setGoalsSummary] = useState({
    totalSaved: 0,
    totalTarget: 0,
    monthlySaved: 0,
    monthlyTarget: 0,
  });
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [extractedExpenses, setExtractedExpenses] = useState<ExpenseDto[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState<AnnouncementDto | null>(null);
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const { t } = useTranslation();

  const handleAddExpense = async (newExpense: {
    description: string;
    amount: number;
    method: string;
    isRecurring: boolean;
    categoryId: number;
  }) => {
    try {
      await addExpense({
        ...newExpense,
        paymentMethod: newExpense.method,
      });
      // Refresh financial data
      const finData = await getFinancialSummary();
      setFinancialData(finData);
      setIsExpenseModalVisible(false);
    } catch (error) {
      console.error("Error adding expense from dashboard:", error);
      Alert.alert("Error", "Failed to add expense");
    }
  };

  const handleAddIncome = async (newIncome: {
    name: string;
    amount: number;
    method: string;
    isRecurring: boolean;
  }) => {
    try {
      await addIncome(newIncome);
      // Refresh financial data
      const finData = await getFinancialSummary();
      setFinancialData(finData);
      setIsIncomeModalVisible(false);
    } catch (error) {
      console.error("Error adding income from dashboard:", error);
      Alert.alert("Error", "Failed to add income");
    }
  };

  const handleScanReceipt = async () => {
    Alert.alert(
      t("scan.title") || "Scan Receipt",
      t("scan.message") || "Choose a source",
      [
        {
          text: t("scan.camera") || "Camera",
          onPress: () => processImage(ImagePicker.launchCameraAsync),
        },
        {
          text: t("scan.gallery") || "Gallery",
          onPress: () => processImage(ImagePicker.launchImageLibraryAsync),
        },
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const processImage = async (
    launcher: typeof ImagePicker.launchCameraAsync
  ) => {
    try {
      const result = await launcher({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsExtracting(true);
        const asset = result.assets[0];
        const expenses = await extractExpenseFromImage(
          asset.uri,
          asset.mimeType || "image/jpeg",
          asset.fileName || "receipt.jpg"
        );
        setExtractedExpenses(expenses);
        setIsReviewModalVisible(true);
      }
    } catch (error) {
      console.error("Image processing error:", error);
      Alert.alert("Error", "Failed to process receipt image");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVoiceRecordingComplete = async (uri: string) => {
    setIsVoiceModalVisible(false);
    setIsExtracting(true);
    try {
      const expenses = await extractExpenseFromAudio(
        uri,
        "audio/mpeg",
        "voice-expense.mp3"
      );
      setExtractedExpenses(expenses);
      setIsReviewModalVisible(true);
    } catch (error) {
      console.error("Voice processing error:", error);
      Alert.alert("Error", "Failed to process voice command");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmBulkAdd = async (expenses: ExpenseDto[]) => {
    if (expenses.length === 0) {
      setIsReviewModalVisible(false);
      return;
    }

    try {
      setLoading(true);
      const commands = expenses.map((e) => ({
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
      const finData = await getFinancialSummary();
      setFinancialData(finData);
      await calculateGoalsSummary();
      
      Alert.alert("Success", `Added ${expenses.length} expenses`);
    } catch (error) {
      console.error("Bulk add error:", error);
      Alert.alert("Error", "Failed to add expenses");
    } finally {
      setLoading(false);
    }
  };

  const transformSpendingData = (data: FinancialDashboardDto) => {
    // Only use actual API data, don't fall back to mock data
    if (
      !data.topSpendingCategories ||
      data.topSpendingCategories.length === 0
    ) {
      return []; // Return empty array when no spending data is available
    }

    // Sort categories by amount and take top 4
    const topCategories = [...data.topSpendingCategories]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 4);

    // Map categories to their proper colors based on category name
    return topCategories.map((category) => {
      return {
        name: category.categoryName || "Unknown",
        amount: category.totalAmount,
        color: getCategoryColor(category.categoryName || "Other", isDarkMode),
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
      const totalSaved = goals.reduce(
        (sum: number, goal: GoalHistoryDto) => sum + (goal.currentAmount || 0),
        0,
      );
      const totalTarget = goals.reduce(
        (sum: number, goal: GoalHistoryDto) => sum + (goal.targetAmount || 0),
        0,
      );

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
        return (
          createdDate.getMonth() === currentMonth &&
          createdDate.getFullYear() === currentYear
        );
      });

      // Calculate monthly totals (or use a simpler approach if this doesn't match your requirements)
      const monthlySaved = monthlyGoals.reduce(
        (sum: number, goal: GoalHistoryDto) => sum + (goal.currentAmount || 0),
        0,
      );
      const monthlyTarget = monthlyGoals.reduce(
        (sum: number, goal: GoalHistoryDto) => sum + (goal.targetAmount || 0),
        0,
      );

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

  // Refresh user and financial data on focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          // Parallel fetch
          const [summary, user] = await Promise.all([
            getFinancialSummary(),
            refreshUser()
          ]);
          if (summary) {
            setFinancialData(summary);
          }
          await calculateGoalsSummary();
        } catch (error) {
          console.error("Dashboard focus refresh error:", error);
        }
      };
      fetchData();
    }, [refreshUser])
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch financial data, user info, categories and announcements in parallel
        const [finData, user, catData, announcements] = await Promise.all([
          getFinancialSummary(),
          getCurrentUser(),
          getUserCategories(),
          getActiveAnnouncements(),
        ]);
        setFinancialData(finData);
        setUserInfo(user);
        setCategories(catData);

        // Show the first active announcement if any
        if (announcements && announcements.length > 0) {
          const firstAnnouncement = announcements[0];
          const lastSeenId = await AsyncStorage.getItem("lastSeenAnnouncementId");
          
          if (lastSeenId !== firstAnnouncement.id.toString()) {
            setActiveAnnouncement(firstAnnouncement);
            setIsAnnouncementVisible(true);
            await AsyncStorage.setItem("lastSeenAnnouncementId", firstAnnouncement.id.toString());
          }
        }

        // Calculate goals summary after financial data is loaded
        await calculateGoalsSummary();
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
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
      <ScreenHeader
        isDarkMode={isDarkMode}
        onNavigate={handleNavigate}
        currentRoute="Dashboard"
      />
      <View style={styles.dashboardHeader}>
        <Text
          style={[styles.dashboardTitle, { color: themeColors.card_title }]}
        >
          {t("dashboard.dashboardWelcome")}, {userInfo?.firstName || "User"}!
        </Text>
        <Text style={styles.dashboardSubText}>
          {t("dashboard.dashboardSubtext")}
        </Text>
      </View>
      {financialData && (
        <>
          <DashboardCarousel
            isDarkMode={isDarkMode}
            data={transformFinancialData(financialData, isDarkMode, isPrivacyMode, preferredCurrency)}
          />

          {/* Use the monthly savings view for the dashboard */}
          <SavingGoalSummary
            currentAmount={goalsSummary.monthlySaved}
            targetAmount={goalsSummary.monthlyTarget}
            isDarkMode={isDarkMode}
            currency={preferredCurrency}
          />

          <SpendingChart
            isDarkMode={isDarkMode}
            data={transformSpendingData(financialData)}
          />
        </>
      )}
      <ActionFAB
        isDarkMode={isDarkMode}
        actions={[
          {
            label: t("fab.manualExpense") || "Manual Expense",
            icon: "minus",
            onPress: () => {
              if (categories.length > 0) {
                setIsExpenseModalVisible(true);
              } else {
                Alert.alert("Error", "Please wait for categories to load");
              }
            },
            color: themeColors.red,
          },
          {
            label: t("fab.manualIncome") || "Manual Income",
            icon: "plus",
            onPress: () => setIsIncomeModalVisible(true),
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
      <AddExpenseModal
        visible={isExpenseModalVisible}
        onClose={() => setIsExpenseModalVisible(false)}
        onAdd={handleAddExpense}
        isDarkMode={isDarkMode}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name || "Other",
        }))}
      />
      <AddIncomeModal
        visible={isIncomeModalVisible}
        onClose={() => setIsIncomeModalVisible(false)}
        onAdd={handleAddIncome}
        isDarkMode={isDarkMode}
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
      />
      <AnnouncementModal
        visible={isAnnouncementVisible}
        onClose={() => setIsAnnouncementVisible(false)}
        announcement={activeAnnouncement}
        isDarkMode={isDarkMode}
      />
      {isExtracting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={themeColors.green} />
          <Text style={[styles.loadingText, { color: "white" }]}>
            {t("common.extracting") || "Processing..."}
          </Text>
        </View>
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
  },
  profilePhotoContainer: {
    width: horizontalScale(40),
    height: horizontalScale(40),
    borderRadius: horizontalScale(20),
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
    paddingHorizontal: horizontalScale(20),
  },
  dashboardTitle: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
  },
  dashboardSubText: {
    fontSize: moderateScale(16),
    color: "#999999",
    marginTop: verticalScale(4),
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
