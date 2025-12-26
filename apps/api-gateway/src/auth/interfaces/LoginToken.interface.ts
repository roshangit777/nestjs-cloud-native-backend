export interface LoginToken {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  };
}
export interface AdminLoginToken {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  };
}

export interface LoginTokenResponse extends LoginToken {
  message: string;
}

export interface CurrentUserInfo {
  name: string;
  sub: number;
  email: string;
  role: string;
}
