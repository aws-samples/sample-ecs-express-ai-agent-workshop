import { createContext, useContext } from 'react'

export type Locale = 'en' | 'ja'

interface LocaleState {
  locale: Locale
  changeLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleState>({
  locale: 'en',
  changeLocale: () => {},
})

export function useLocale(): LocaleState {
  return useContext(LocaleContext)
}
