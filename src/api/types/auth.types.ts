export interface RegisterUserCommand {
   email?: string;
   password?: string;
   firstName?: string;
   lastName?: string;
}

export interface LoginUserCommand {
   email?: string;
   password?: string;
}

export interface AuthResponse {
   id: string;
   email: string;
   token: string;
   refreshToken: string;
   refreshTokenExpiration: string;
}

export interface UpdatePasswordCommand {
   currentPassword?: string;
   newPassword?: string;
}

export interface RefreshTokenRequest {
   token: string;
}

export interface RefreshTokenResponse {
   id: string;
   email: string;
   token: string;
   refreshToken: string;
   refreshTokenExpiration: string;
}

export interface ForgotPasswordCommand {
   email: string;
}

export interface VerifyResetCodeCommand {
   email: string;
   code: string;
}

export interface ResetPasswordWithCodeCommand {
   email: string;
   code: string;
   newPassword?: string;
}
