import type { DashboardSlideData } from "../../components/DashboardCarousel";
import { FinancialSummary } from "../services/api";
import { getThemeColors } from "./getThemeColors";
import i18next from "i18next";
import { getCurrencySymbol } from "./currencyUtils";

export const transformFinancialData = (financialData: FinancialSummary, isDarkMode: boolean, isPrivacyMode: boolean, preferredCurrency?: string): DashboardSlideData[] => {
   const themeColors = getThemeColors(isDarkMode);

   const formatAmount = (amount: number, currency?: string) => {
      // Use preferredCurrency as the fallback if available
      const symbol = getCurrencySymbol(preferredCurrency || currency);
      return isPrivacyMode ? "****" : `${symbol}${amount.toLocaleString()}`;
   };

   return [
      {
         id: 1,
         title: i18next.t("dashboardCard.totalNetWorth"),
         description: formatAmount(financialData.totalBalance, financialData.currency),
         percentage: "", // Removed due to API schema change
         color: themeColors.yellow,
      },
      {
         id: 2,
         title: i18next.t("dashboardCard.totalIncome"), // Reusing/creating a translation map proxy
         description: formatAmount(financialData.totalIncome, financialData.currency),
         percentage: "", 
         color: themeColors.green,
      },
      {
         id: 3,
         title: i18next.t("dashboardCard.totalSpendingThisMonth"),
         description: formatAmount(financialData.totalExpenses, financialData.currency),
         percentage: "",
         color: themeColors.red,
      },
   ];
};

const calculatePercentageChange = (current: number, previous: number): string => {
   if (previous === 0) return "0%";

   const change = ((current - previous) / Math.abs(previous)) * 100;
   const prefix = change >= 0 ? "+" : "";

   return `${prefix}${change.toFixed(1)}%`;
};
