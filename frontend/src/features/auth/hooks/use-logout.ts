import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { tokenStorage } from '@/lib/api-client';

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    tokenStorage.clear();
    queryClient.clear();
    navigate('/login', { replace: true });
  };
}
