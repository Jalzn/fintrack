import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { tokenStorage } from '@/lib/api-client';
import type { AuthToken } from '@/types/api';
import { loginUser } from '../api/auth';
import { authKeys } from '../api/keys';
import type { LoginInput } from '../schemas/auth-schemas';

export function useLoginMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<AuthToken, Error, LoginInput>({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      tokenStorage.set(data.accessToken);
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
      navigate('/', { replace: true });
    },
  });
}
