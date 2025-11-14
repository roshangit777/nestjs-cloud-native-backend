export interface LoginToken {
  accessToken: string;
  refreshToken: string;
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
