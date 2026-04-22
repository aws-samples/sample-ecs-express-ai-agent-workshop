'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signin, totpVerify, forgotPassword, AuthResponse } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { PasswordInput } from '../../components/PasswordInput'

function SignInInner() {
  const t = useTranslations('SignIn')
  const { user, loading, login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetSending, setResetSending] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    if (!loading && user) router.replace(callbackUrl)
  }, [user, loading, router, callbackUrl])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await signin(email, password)
      if ('requiresMfa' in res && res.requiresMfa) {
        setMfaToken(res.mfaToken)
      } else {
        login(res as AuthResponse)
        router.push(callbackUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError(t('forgotPasswordEnterEmail'))
      return
    }
    setResetSending(true)
    setError('')
    try {
      await forgotPassword(email)
      setResetSent(true)
    } catch {
      // Always show success to prevent email enumeration
      setResetSent(true)
    } finally {
      setResetSending(false)
    }
  }

  async function handleMfaSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await totpVerify(mfaToken!, mfaCode)
      login(res)
      router.push(callbackUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  if (mfaToken) {
    return (
      <div className="page-center">
        <div className="card">
          <h1 className="card-title">{t('mfaTitle')}</h1>

          {error && <div className="error-msg">{error}</div>}

          <form className="form" onSubmit={handleMfaSubmit}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
              {t('mfaPrompt')}
            </p>
            <div className="form-field">
              <label htmlFor="mfaCode">{t('mfaCode')}</label>
              <input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? t('mfaVerifying') : t('mfaVerify')}
            </button>
          </form>

          <p className="form-footer">{t('mfaRecoveryHint')}</p>

          <LanguageSwitcher />
        </div>
      </div>
    )
  }

  return (
    <div className="page-center">
      <div className="card">
        <h1 className="card-title">{t('title')}</h1>

        {error && <div className="error-msg">{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">{t('email')}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <PasswordInput
            id="password"
            label={t('password')}
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
            showLabel={t('showPassword')}
            hideLabel={t('hidePassword')}
          />

          <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
            <button
              type="button"
              className="link-button"
              onClick={handleForgotPassword}
              disabled={resetSending}
            >
              {resetSending ? t('forgotPasswordSending') : t('forgotPasswordLink')}
            </button>
          </div>

          {resetSent && (
            <div className="success-msg">{t('forgotPasswordSent')}</div>
          )}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('submitting') : t('submit')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('orDivider')}</span>
        </div>

        <a href="/backend/auth/apple" className="btn-apple">
          <svg className="btn-apple-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          {t('appleButton')}
        </a>

        <a href="/backend/auth/discord" className="btn-discord">
          <svg className="btn-discord-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          {t('discordButton')}
        </a>

        <a href="/backend/auth/github" className="btn-github">
          <svg className="btn-github-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          {t('githubButton')}
        </a>

        <a href="/backend/auth/google" className="btn-google">
          <svg className="btn-google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t('googleButton')}
        </a>

        <a href="/backend/auth/twitter" className="btn-x">
          <svg className="btn-x-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {t('xButton')}
        </a>

        <p className="form-footer">
          {t('noAccount')} <Link href="/signup">{t('signUpLink')}</Link>
        </p>

        <LanguageSwitcher />
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  )
}
