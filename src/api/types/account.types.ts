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
