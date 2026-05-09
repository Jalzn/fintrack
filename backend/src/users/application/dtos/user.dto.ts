export interface UserDTO {
  id: string;
  email: string;
  createdAt: Date;
}

export interface AuthTokenDTO {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}
