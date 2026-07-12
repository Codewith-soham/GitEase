'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { logout, logoutAll } from '@/features/auth/api/auth-api'

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const onSuccess = () => {
    queryClient.clear()
    router.replace('/login')
  }

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess,
  })

  const logoutAllMutation = useMutation({
    mutationFn: logoutAll,
    onSuccess,
  })

  return { logoutMutation, logoutAllMutation }
}
