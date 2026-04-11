export interface CategoryDto {
   id: number;
   name?: string;
   categoryName?: string;
}

export interface CreateCategoryCommand {
   name?: string;
}

export interface UpdateCategoryCommand {
   id: number;
   name?: string;
}

export interface CategoryBreakdownItem {
   categoryName?: string;
   amount: number;
   percentage: number;
   transactionCount: number;
}

export interface TopCategoryDto {
   categoryName?: string;
   totalAmount: number;
   transactionCount: number;
}
