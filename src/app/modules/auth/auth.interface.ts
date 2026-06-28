import { Role } from '../users/user.constant';

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginResult {
  tokens: IAuthTokens;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    mustResetPassword: boolean;
  };
}

export interface IResetTicketPayload {
  email: string;
  purpose: 'PASSWORD_RESET';
}
