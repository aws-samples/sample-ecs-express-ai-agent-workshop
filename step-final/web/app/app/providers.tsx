'use client'

import { useState, useEffect, ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { LocaleContext, Locale } from '../contexts/LocaleContext'
import en from '../messages/en.json'
import ja from '../messages/ja.json'

const messages = { en, ja }

const frontSha = process.env.NEXT_PUBLIC_GIT_SHA ?? 'unknown'

function GitShaOverlay() {
  const [label, setLabel] = useState(frontSha)

  useEffect(() => {
    fetch('/backend/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const backSha = data?.gitSha as string | undefined
        if (!backSha) return
        setLabel(
          frontSha === backSha
            ? `f/b: ${frontSha}`
            : `f: ${frontSha}, b: ${backSha}`,
        )
      })
      .catch(() => {})
  }, [])

  return <span className="git-sha">{label}</span>
}

export function Providers({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem('locale') as Locale | null
    if (stored === 'en' || stored === 'ja') {
      setLocale(stored)
    } else if (navigator.language.startsWith('ja')) {
      setLocale('ja')
    }
  }, [])

  function changeLocale(newLocale: Locale) {
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <LocaleContext.Provider value={{ locale, changeLocale }}>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <GitShaOverlay />
          </ThemeProvider>
        </AuthProvider>
      </LocaleContext.Provider>
    </NextIntlClientProvider>
  )
}
