'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { verifyEmail } from '../../lib/api'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'

function VerifyEmailInner() {
  const t = useTranslations('VerifyEmail')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError(t('invalidToken'))
      return
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setError(err instanceof Error ? err.message : t('errorFallback'))
      })
  }, [token, t])

  return (
    <div className="page-center">
      <div className="card">
        <h1 className="card-title">{t('title')}</h1>

        {status === 'loading' && <p>{t('verifying')}</p>}

        {status === 'success' && (
          <>
            <p>{t('successMessage')}</p>
            <p className="form-footer">
              <Link href="/signin">{t('signInLink')}</Link>
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-msg">{error}</div>
            <p className="form-footer">
              <Link href="/signup">{t('signUpLink')}</Link>
            </p>
          </>
        )}

        <LanguageSwitcher />
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  )
}
