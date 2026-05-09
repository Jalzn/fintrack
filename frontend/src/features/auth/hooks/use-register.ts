import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { tokenStorage } from '@/lib/api-client';
import type { AuthToken } from '@/types/api';
import { type RegisterPayload, registerUser } from '../api/auth';
import { authKeys } from '../api/keys';

export function useRegisterMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<AuthToken, Error, RegisterPayload>({
    mutationFn: registerUser,
    onSuccess: async (data) => {
      tokenStorage.set(data.accessToken);
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
      navigate('/', { replace: true });
    },
  });
}
