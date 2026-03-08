import { CategoryBreakdownItem } from './category.types';

export interface MonthlyTrendItem {
   month: number;
   monthName?: string;
   totalIncome: number;
   totalExpenses: number;
   netAmount: number;
}

export interface MonthlyTrendsDto {
   year: number;
   monthlyData: MonthlyTrendItem[];
}

export interface SpendingBreakdownDto {
   categoryBreakdown: CategoryBreakdownItem[];
   totalAmount: number;
   startDate?: string;
   endDate?: string;
}
