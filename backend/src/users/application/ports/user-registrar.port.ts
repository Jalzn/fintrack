import type { StoredRefreshToken, User } from '@/users/domain';

export interface IUserRegistrar {
  register(user: User, token: StoredRefreshToken): Promise<void>;
}
