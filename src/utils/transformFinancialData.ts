import type { DashboardSlideData } from "../../components/DashboardCarousel";
import { FinancialSummary } from "../services/api";
import { getThemeColors } from "./getThemeColors";
import i18next from "i18next";

export const transformFinancialData = (financialData: FinancialSummary, isDarkMode: boolean): DashboardSlideData[] => {
   const themeColors = getThemeColors(isDarkMode);

   return [
      {
         id: 1,
         title: i18next.t("dashboardCard.totalNetWorth"),
         description: `$${financialData.totalBalance.toLocaleString()}`,
         percentage: "", // Removed due to API schema change
         color: themeColors.yellow,
      },
      {
         id: 2,
         title: i18next.t("dashboardCard.totalIncome"), // Reusing/creating a translation map proxy
         description: `$${financialData.totalIncome.toLocaleString()}`,
         percentage: "", 
         color: themeColors.green,
      },
      {
         id: 3,
         title: i18next.t("dashboardCard.totalSpendingThisMonth"),
         description: `$${financialData.totalExpenses.toLocaleString()}`,
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
