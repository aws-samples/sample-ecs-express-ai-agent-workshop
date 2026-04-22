'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMe } from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'

function OAuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, refreshUser } = useAuth()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const linked = searchParams.get('linked')

    // Account linking callback — refresh user and redirect to settings
    if (linked !== null) {
      refreshUser().then(() => router.replace('/settings'))
      return
    }

    if (!accessToken || !refreshToken) {
      router.replace('/signin')
      return
    }

    getMe(accessToken)
      .then((user) => {
        login({ accessToken, refreshToken, user })
        router.replace('/dashboard')
      })
      .catch(() => {
        router.replace('/signin')
      })
  }, [searchParams, router, login, refreshUser])

  return null
}

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackInner />
    </Suspense>
  )
}
