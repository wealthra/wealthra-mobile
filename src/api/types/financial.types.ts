import { TopCategoryDto } from './category.types';
import { BudgetAlertDto } from './budget.types';

export interface RecentTransactionDto {
   id: number;
   type?: string;
   description?: string;
   amount: number;
   transactionDate?: string;
   categoryName?: string | null;
   currency?: string;
}

export interface FinancialDashboardDto {
   totalBalance: number;
   totalIncome: number;
   totalExpenses: number;
   currency?: string;
   recentTransactions: RecentTransactionDto[];
   topSpendingCategories: TopCategoryDto[];
   budgetAlerts: BudgetAlertDto[];
   unreadNotificationsCount: number;
}

export interface FinancialSummary extends FinancialDashboardDto {}