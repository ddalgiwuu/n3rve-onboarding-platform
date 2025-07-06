export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  profilePicture?: string;
  provider?: string;
  accessToken?: string;
}

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{
    value: string;
    verified: boolean;
  }>;
  photos: Array<{
    value: string;
  }>;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}