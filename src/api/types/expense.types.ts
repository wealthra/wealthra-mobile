export interface ExpenseDto {
   id: number;
   description?: string;
   amount: number;
   paymentMethod?: string;
   isRecurring?: boolean;
   transactionDate?: string;
   categoryId: number;
   categoryName?: string;
}

export interface CreateExpenseCommand {
   description?: string;
   amount?: number;
   paymentMethod?: string;
   isRecurring?: boolean;
   categoryId?: number;
   transactionDate?: string;
}

export interface UpdateExpenseCommand {
   id?: number;
   description?: string;
   amount?: number;
   paymentMethod?: string;
   isRecurring?: boolean;
   categoryId?: number;
   transactionDate?: string;
}

export interface PaginatedListOfExpenseDto {
   items: ExpenseDto[];
   pageNumber: number;
   totalPages?: number;
   totalCount?: number;
   hasPreviousPage?: boolean;
   hasNextPage?: boolean;
}

export interface ExpenseSummaryDto {
   period?: string;
   totalAmount: number;
   expenseCount: number;
   categoryBreakdown?: Record<string, number>;
}

export interface ExpenseGeneralInfoDto {
   weeklyTotal: number;
   monthlyTotal: number;
   yearlyTotal: number;
   recurringExpensesThisMonth: number;
}
