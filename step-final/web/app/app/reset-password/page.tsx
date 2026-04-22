'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { resetPassword } from '../../lib/api'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { PasswordInput } from '../../components/PasswordInput'

function ResetPasswordInner() {
  const t = useTranslations('ResetPassword')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'form' | 'submitting' | 'success' | 'error'>('form')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError(t('invalidToken'))
    }
  }, [token, t])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setStatus('submitting')
    setError('')
    try {
      await resetPassword(token, password)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : t('errorFallback'))
    }
  }

  return (
    <div className="page-center">
      <div className="card">
        <h1 className="card-title">{t('title')}</h1>

        {status === 'form' || status === 'submitting' ? (
          <form className="form" onSubmit={handleSubmit}>
            <PasswordInput
              id="password"
              label={t('newPassword')}
              autoComplete="new-password"
              showLabel={t('showPassword')}
              hideLabel={t('hidePassword')}
              value={password}
              onChange={setPassword}
              minLength={8}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={status === 'submitting' || password.length < 8}
            >
              {status === 'submitting' ? t('submitting') : t('submit')}
            </button>
          </form>
        ) : null}

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
              <Link href="/signin">{t('signInLink')}</Link>
            </p>
          </>
        )}

        <LanguageSwitcher />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  )
}
