import { useLocale } from '../contexts/LocaleContext'

export function LanguageSwitcher() {
  const { locale, changeLocale } = useLocale()

  return (
    <div className="lang-switcher">
      <button
        className={`lang-btn${locale === 'en' ? ' lang-btn-active' : ''}`}
        onClick={() => changeLocale('en')}
        disabled={locale === 'en'}
      >
        EN
      </button>
      <span className="lang-sep">|</span>
      <button
        className={`lang-btn${locale === 'ja' ? ' lang-btn-active' : ''}`}
        onClick={() => changeLocale('ja')}
        disabled={locale === 'ja'}
      >
        JA
      </button>
    </div>
  )
}
