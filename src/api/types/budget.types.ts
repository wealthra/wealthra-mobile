export interface BudgetDto {
   id: number;
   limitAmount: number;
   currentAmount: number;
   percentageUsed: number;
   status?: string;
   categoryId: number;
   categoryName?: string;
}

export interface CreateBudgetCommand {
   categoryId?: number;
   limitAmount?: number;
}

export interface UpdateBudgetCommand {
   id?: number;
   limitAmount?: number;
}

export interface BudgetAlertDto {
   budgetId: number;
   categoryName?: string;
   limitAmount: number;
   currentAmount: number;
   percentageUsed: number;
   status?: string;
}

export interface BudgetOverviewDto {
   totalLimit: number;
   totalSpent: number;
   percentageUsed: number;
   overallStatus?: string;
   totalBudgets: number;
   budgetsExceeded: number;
   budgetsWarning: number;
}

export interface MonthlyBudgetCategoryDto {
   budgetId: number;
   categoryName?: string;
   limitAmount: number;
   spentThisMonth: number;
   remainingAmount: number;
   percentageUsed: number;
   status?: string;
}

export interface MonthlyBudgetSummaryDto {
   totalLimitAmount: number;
   totalSpentThisMonth: number;
   totalRemainingAmount: number;
   overallPercentageUsed: number;
   overallStatus?: string;
   totalBudgets: number;
   budgetsExceeded: number;
   budgetsOnWarning: number;
   categoryBreakdown?: MonthlyBudgetCategoryDto[];
}

export interface PaginatedListOfBudgetDto {
   items: BudgetDto[];
   pageNumber: number;
   totalPages?: number;
   totalCount?: number;
   hasPreviousPage?: boolean;
   hasNextPage?: boolean;
}
