export interface UserDto {
   id: string;
   email: string;
   firstName: string;
   lastName: string;
   avatarUrl?: string | null;
   preferredCurrency?: string;
   createdAt: string;
}

export interface UpdateUserCommand {
   firstName?: string;
   lastName?: string;
   avatarUrl?: string | null;
}

export interface UserUsageDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: number;
  subscriptionPlanId: number;
  subscriptionPlanName: string;
  ocrRequestsThisMonth: number;
  sttRequestsThisMonth: number;
  monthlyOcrLimit: number;
  monthlySttLimit: number;
  lastUsageActivityDate: string;
}
