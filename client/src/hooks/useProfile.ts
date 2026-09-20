import { useCallback } from 'react';
import { UserService } from '../services/UserService';
import { useAuth } from './useAuth';
import { extractErrorMessage } from '../lib/authErrors';

export const useProfile = () => {
  const { refresh } = useAuth();

  const updateProfile = useCallback(
    async (data: { username?: string; firstname?: string; lastname?: string }) => {
      try {
        const updated = await UserService.updateProfile(data);
        await refresh();
        return updated;
      } catch (err) {
        throw new Error(extractErrorMessage(err, 'Failed to update profile'));
      }
    },
    [refresh]
  );

  return { updateProfile };
}