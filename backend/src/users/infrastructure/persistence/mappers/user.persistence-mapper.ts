import { User } from '@/users/domain';
import type { NewUserRow, UserRow } from '../schema';

export function userRowToDomain(row: UserRow): User {
  return User.restore({
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
  });
}

export function userToRow(user: User): NewUserRow {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
  };
}
