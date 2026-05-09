import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router';
import { tokenStorage } from '@/lib/api-client';

export function RequireAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasToken = tokenStorage.get() !== null;

  useEffect(() => {
    const onLogout = () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    };
    window.addEventListener('fintrack:logout', onLogout);
    return () => window.removeEventListener('fintrack:logout', onLogout);
  }, [navigate, queryClient]);

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
