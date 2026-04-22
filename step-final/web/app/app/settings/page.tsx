'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, Theme } from '../../contexts/ThemeContext'
import { AppHeader } from '../../components/AppHeader'
import { unlinkProvider, deleteAccount, updateEmail, resendVerification, forgotPassword, totpSetup, totpEnable, totpDisable, totpRegenerateRecoveryCodes } from '../../lib/api'

const THEME_OPTIONS: { value: Theme; labelKey: string }[] = [
  { value: 'system', labelKey: 'themeSystem' },
  { value: 'light', labelKey: 'themeLight' },
  { value: 'dark', labelKey: 'themeDark' },
]

const PROVIDERS = [
  { key: 'apple', label: 'Apple' },
  { key: 'discord', label: 'Discord' },
  { key: 'github', label: 'GitHub' },
  { key: 'google', label: 'Google' },
  { key: 'twitter', label: 'X (Twitter)' },
] as const

export default function SettingsPage() {
  const t = useTranslations('Settings')
  const { user, accessToken, loading, refreshUser, logout } = useAuth()
  const { theme, changeTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [error, setError] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailResending, setEmailResending] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [passwordResetSending, setPasswordResetSending] = useState(false)
  const [mfaStep, setMfaStep] = useState<'idle' | 'setup' | 'recovery' | 'disable' | 'regenerate'>('idle')
  const [totpUri, setTotpUri] = useState('')
  const [totpSecretText, setTotpSecretText] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [mfaSubmitting, setMfaSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/signin?callbackUrl=${pathname}`)
    }
  }, [user, loading, router, pathname])

  // Refresh user on mount (picks up newly linked provider after OAuth redirect)
  useEffect(() => {
    if (!loading && user && accessToken) {
      refreshUser()
    }
  }, [loading])

  if (loading || !user) return null

  const linkedProviders: Record<string, boolean> = {
    apple: !!user.appleId,
    discord: !!user.discordId,
    github: !!user.githubId,
    google: !!user.googleId,
    twitter: !!user.twitterId,
  }

  async function handleUnlink(provider: string) {
    if (!accessToken) return
    setError(null)
    try {
      await unlinkProvider(accessToken, provider)
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    }
  }

  async function handleDeleteAccount() {
    if (!accessToken) return
    if (!window.confirm(t('deleteAccountConfirm'))) return
    setError(null)
    try {
      await deleteAccount(accessToken)
      logout()
      router.replace('/signin')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    }
  }

  async function handleEmailSave() {
    if (!accessToken || !emailInput.trim()) return
    setEmailSaving(true)
    setError(null)
    setEmailSuccess(null)
    try {
      await updateEmail(accessToken, emailInput.trim())
      await refreshUser()
      setEmailSuccess(t('emailUpdated'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setEmailSaving(false)
    }
  }

  async function handleResendVerification() {
    if (!user) return
    setEmailResending(true)
    setError(null)
    setEmailSuccess(null)
    try {
      await resendVerification(user.email)
      setEmailSuccess(t('emailVerificationSent'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setEmailResending(false)
    }
  }

  async function handlePasswordReset() {
    if (!user) return
    setPasswordResetSending(true)
    setError(null)
    setEmailSuccess(null)
    try {
      await forgotPassword(user.email)
      setEmailSuccess(t('passwordResetSent'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setPasswordResetSending(false)
    }
  }

  async function handleMfaSetup() {
    if (!accessToken) return
    setError(null)
    setMfaSubmitting(true)
    try {
      const res = await totpSetup(accessToken)
      setTotpUri(res.uri)
      setTotpSecretText(res.secret)
      setMfaStep('setup')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setMfaSubmitting(false)
    }
  }

  async function handleMfaEnable() {
    if (!accessToken || !mfaCode.trim()) return
    setError(null)
    setMfaSubmitting(true)
    try {
      const res = await totpEnable(accessToken, mfaCode.trim())
      setRecoveryCodes(res.recoveryCodes)
      setMfaCode('')
      setMfaStep('recovery')
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setMfaSubmitting(false)
    }
  }

  async function handleMfaDisable() {
    if (!accessToken || !mfaCode.trim()) return
    setError(null)
    setMfaSubmitting(true)
    try {
      await totpDisable(accessToken, mfaCode.trim())
      setMfaCode('')
      setMfaStep('idle')
      await refreshUser()
      setEmailSuccess(t('mfaDisabled'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setMfaSubmitting(false)
    }
  }

  async function handleMfaRegenerate() {
    if (!accessToken || !mfaCode.trim()) return
    setError(null)
    setMfaSubmitting(true)
    try {
      const res = await totpRegenerateRecoveryCodes(accessToken, mfaCode.trim())
      setRecoveryCodes(res.recoveryCodes)
      setMfaCode('')
      setMfaStep('recovery')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setMfaSubmitting(false)
    }
  }

  function handleEmailSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    setEmailInput(e.target.value)
  }

  function linkUrl(provider: string): string {
    return `/backend/auth/link/${provider}?token=${accessToken}`
  }

  return (
    <div className="dashboard">
      <AppHeader />

      <main className="dashboard-body">
        <div className="user-card">
          <h2>{t('title')}</h2>
          {error && <p className="error-msg">{error}</p>}
          {emailSuccess && <p className="success-msg">{emailSuccess}</p>}

          <h3 className="settings-section-title">{t('email')}</h3>
          <div className="email-section">
            {(() => {
              const isInvalidEmail = user.email.endsWith('.invalid')
              const selectableEmails = (user.socialEmails ?? []).filter((e) => e !== user.email)
              return (
                <>
                  <div className="email-status-row">
                    <span className={`email-current${isInvalidEmail ? ' email-not-set' : ''}`}>
                      {isInvalidEmail ? t('emailNotSet') : user.email}
                    </span>
                    {!isInvalidEmail && (
                      <span className={`email-badge ${user.emailVerified ? 'email-badge-verified' : 'email-badge-unverified'}`}>
                        {user.emailVerified ? t('emailVerified') : t('emailUnverified')}
                      </span>
                    )}
                  </div>

                  {!isInvalidEmail && !user.emailVerified && (
                    <button
                      className="btn-ghost email-resend-btn"
                      onClick={handleResendVerification}
                      disabled={emailResending}
                    >
                      {emailResending ? t('emailResending') : t('emailResendVerification')}
                    </button>
                  )}

                  <div className="email-edit-row">
                    <div className="email-combo">
                      <input
                        type="email"
                        className="email-combo-input"
                        placeholder={t('emailInputPlaceholder')}
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                      />
                      {selectableEmails.length > 0 && (
                        <select
                          className="email-combo-select"
                          value=""
                          onChange={handleEmailSelect}
                          aria-label={t('emailSelectLabel')}
                        >
                          <option value="" disabled></option>
                          {selectableEmails.map((e) => (
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <button
                      className="btn-primary email-save-btn"
                      onClick={handleEmailSave}
                      disabled={emailSaving || !emailInput.trim() || emailInput.trim() === user.email}
                    >
                      {emailSaving ? t('emailSaving') : t('emailSave')}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        <div className="user-card" style={{ marginTop: '1.5rem' }}>
          <h3 className="settings-section-title">{t('passwordReset')}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 1rem' }}>
            {!user.emailVerified
              ? t('passwordRequiresVerification')
              : user.hasPassword
                ? t('passwordResetDescription')
                : t('passwordSetDescription')}
          </p>
          <button
            className="btn-ghost"
            onClick={handlePasswordReset}
            disabled={passwordResetSending || !user.emailVerified}
          >
            {passwordResetSending ? t('passwordResetSending') : (user.hasPassword ? t('passwordResetButton') : t('passwordSetButton'))}
          </button>
        </div>

        <div className="user-card" style={{ marginTop: '1.5rem' }}>
          <h3 className="settings-section-title">{t('mfa')}</h3>
          {mfaStep === 'idle' && !user.totpEnabled && (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 1rem' }}>
                {t('mfaSetupDescription')}
              </p>
              <button className="btn-primary" onClick={handleMfaSetup} disabled={mfaSubmitting}>
                {mfaSubmitting ? t('mfaSetupVerifying') : t('mfaEnable')}
              </button>
            </>
          )}
          {mfaStep === 'setup' && (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 1rem' }}>
                {t('mfaSetupScanQr')}
              </p>
              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`}
                  alt="TOTP QR Code"
                  width={200}
                  height={200}
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.5rem 0' }}>
                {t('mfaSetupManualEntry')}
              </p>
              <code style={{ display: 'block', wordBreak: 'break-all', padding: '0.5rem', background: 'var(--color-bg-muted, #f5f5f5)', borderRadius: '4px', fontSize: '0.8rem', margin: '0.5rem 0 1rem' }}>
                {totpSecretText}
              </code>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.5rem 0' }}>
                {t('mfaSetupVerify')}
              </p>
              <div className="form-field" style={{ margin: '0.5rem 0' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={handleMfaEnable} disabled={mfaSubmitting || mfaCode.length < 6}>
                {mfaSubmitting ? t('mfaSetupVerifying') : t('mfaSetupVerifyButton')}
              </button>
            </>
          )}
          {mfaStep === 'recovery' && (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 1rem' }}>
                {t('mfaRecoveryCodesDescription')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '1rem 0', padding: '1rem', background: 'var(--color-bg-muted, #f5f5f5)', borderRadius: '4px' }}>
                {recoveryCodes.map((code, i) => (
                  <code key={i} style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{code}</code>
                ))}
              </div>
              <button className="btn-primary" onClick={() => { setMfaStep('idle'); setRecoveryCodes([]); }}>
                {t('mfaRecoveryCodesSaved')}
              </button>
            </>
          )}
          {mfaStep === 'idle' && user.totpEnabled && (
            <>
              <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 1rem' }}>
                <span className="email-badge email-badge-verified">{t('mfaEnabled')}</span>
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn-danger" onClick={() => setMfaStep('disable')}>
                  {t('mfaDisable')}
                </button>
                <button className="btn-ghost" onClick={() => setMfaStep('regenerate')}>
                  {t('mfaRegenerateRecoveryCodes')}
                </button>
              </div>
            </>
          )}
          {mfaStep === 'disable' && (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.5rem 0' }}>
                {t('mfaDisablePrompt')}
              </p>
              <div className="form-field" style={{ margin: '0.5rem 0' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-danger" onClick={handleMfaDisable} disabled={mfaSubmitting || mfaCode.length < 6}>
                  {mfaSubmitting ? t('mfaDisabling') : t('mfaDisableButton')}
                </button>
                <button className="btn-ghost" onClick={() => { setMfaStep('idle'); setMfaCode(''); }}>
                  {t('mfaCancel')}
                </button>
              </div>
            </>
          )}
          {mfaStep === 'regenerate' && (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.5rem 0' }}>
                {t('mfaRegeneratePrompt')}
              </p>
              <div className="form-field" style={{ margin: '0.5rem 0' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-primary" onClick={handleMfaRegenerate} disabled={mfaSubmitting || mfaCode.length < 6}>
                  {mfaSubmitting ? t('mfaRegenerating') : t('mfaRegenerateButton')}
                </button>
                <button className="btn-ghost" onClick={() => { setMfaStep('idle'); setMfaCode(''); }}>
                  {t('mfaCancel')}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="user-card" style={{ marginTop: '1.5rem' }}>
          <h3 className="settings-section-title">{t('linkedAccounts')}</h3>
          <div className="linked-accounts-list">
            {PROVIDERS.map(({ key, label }) => (
              <div key={key} className="linked-account-row">
                <span className="linked-account-provider">{label}</span>
                {linkedProviders[key] ? (
                  <button
                    className="btn-danger"
                    onClick={() => handleUnlink(key)}
                  >
                    {t('unlink')}
                  </button>
                ) : (
                  <a href={linkUrl(key)} className="btn-primary btn-link-provider">
                    {t('link')}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="user-card" style={{ marginTop: '1.5rem' }}>
          <h3 className="settings-section-title">{t('theme')}</h3>
          <div className="theme-selector">
            {THEME_OPTIONS.map(({ value, labelKey }) => (
              <button
                key={value}
                className={`theme-btn${theme === value ? ' theme-btn-active' : ''}`}
                onClick={() => changeTheme(value)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="user-card" style={{ marginTop: '1.5rem' }}>
          <h3 className="settings-section-title">{t('deleteAccount')}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 1rem' }}>
            {t('deleteAccountDescription')}
          </p>
          <button className="btn-danger" onClick={handleDeleteAccount}>
            {t('deleteAccount')}
          </button>
        </div>
      </main>
    </div>
  )
}
