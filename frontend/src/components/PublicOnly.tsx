import { Navigate, Outlet } from 'react-router';
import { tokenStorage } from '@/lib/api-client';

export function PublicOnly() {
  const hasToken = tokenStorage.get() !== null;

  if (hasToken) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
