export interface IncomeDto {
   id: number;
   name?: string;
   amount: number;
   method?: string;
   isRecurring?: boolean;
   transactionDate?: string;
}

export interface CreateIncomeCommand {
   name?: string;
   amount?: number;
   method?: string;
   isRecurring?: boolean;
   transactionDate?: string;
}

export interface UpdateIncomeCommand {
   id?: number;
   name?: string;
   amount?: number;
   method?: string;
   isRecurring?: boolean;
   transactionDate?: string;
}

export interface PaginatedListOfIncomeDto {
   items: IncomeDto[];
   pageNumber: number;
   totalPages?: number;
   totalCount?: number;
   hasPreviousPage?: boolean;
   hasNextPage?: boolean;
}

export interface IncomeSummaryDto {
   period?: string;
   totalAmount: number;
   incomeCount: number;
}

export interface IncomeGeneralInfoDto {
   weeklyTotal: number;
   monthlyTotal: number;
   yearlyTotal: number;
   averageMonthlyIncome: number;
}
