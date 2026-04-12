import type { DashboardSlideData } from "../../components/DashboardCarousel";
import { FinancialSummary } from "../services/api";
import { getThemeColors } from "./getThemeColors";
import i18next from "i18next";

export const transformFinancialData = (financialData: FinancialSummary, isDarkMode: boolean, isPrivacyMode: boolean): DashboardSlideData[] => {
   const themeColors = getThemeColors(isDarkMode);

   const formatAmount = (amount: number) => {
      return isPrivacyMode ? "****" : `$${amount.toLocaleString()}`;
   };

   return [
      {
         id: 1,
         title: i18next.t("dashboardCard.totalNetWorth"),
         description: formatAmount(financialData.totalBalance),
         percentage: "", // Removed due to API schema change
         color: themeColors.yellow,
      },
      {
         id: 2,
         title: i18next.t("dashboardCard.totalIncome"), // Reusing/creating a translation map proxy
         description: formatAmount(financialData.totalIncome),
         percentage: "", 
         color: themeColors.green,
      },
      {
         id: 3,
         title: i18next.t("dashboardCard.totalSpendingThisMonth"),
         description: formatAmount(financialData.totalExpenses),
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
