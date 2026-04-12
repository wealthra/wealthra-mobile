export interface GoalDto {
   id: number;
   name?: string;
   targetAmount: number;
   currentAmount: number;
   progressPercentage: number;
   deadline?: string;
   isCompleted?: boolean;
   currency?: string;
}

export interface CreateGoalCommand {
   name?: string;
   targetAmount?: number;
   currentAmount?: number;
   deadline?: string;
   currency?: string;
}

export interface UpdateGoalCommand {
   id?: number;
   name?: string;
   targetAmount?: number;
   currentAmount?: number;
   deadline?: string;
   currency?: string;
}

export interface GoalHistoryDto {
   id: number;
   name?: string;
   targetAmount: number;
   currentAmount: number;
   progressPercentage: number;
   achievedAmount: number;
   notAchievedAmount: number;
   deadline?: string;
   isCompleted?: boolean;
   currency?: string;
}

export interface PaginatedListOfGoalHistoryDto {
   items: GoalHistoryDto[];
   pageNumber: number;
   totalPages?: number;
   totalCount?: number;
   hasPreviousPage?: boolean;
   hasNextPage?: boolean;
}

export interface GoalsTotalDto {
   totalTargetAmount: number;
   totalCurrentAmount: number;
   overallProgressPercentage: number;
   totalGoals: number;
   achievedGoals: number;
   notAchievedGoals: number;
}
