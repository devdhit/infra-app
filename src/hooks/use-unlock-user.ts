import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useTranslation } from '@/hooks/use-translation'
import { toast } from 'sonner'
import { UnlockUserResponse } from '@/types/users'

export const useUnlockUser = (userId: string) => {
  const { t } = useTranslation()
  
  const mutation = useMutation<UnlockUserResponse, Error, void>({
    mutationFn: async () => {
      const response = await api.post<UnlockUserResponse>(`/users/${userId}/unlock`)
      return response
    },
    onSuccess: (_data) => {
      toast.success(t('users.unlock.success', 'User account unlocked successfully') || 'User account unlocked successfully')
    },
    onError: (error) => {
      toast.error(t('users.unlock.error', 'Failed to unlock user account') || 'Failed to unlock user account')
      console.error('Unlock user error:', error)
    }
  })

  return {
    unlockUser: mutation.mutate,
    isUnlocking: mutation.isPending,
    ...mutation
  }
}