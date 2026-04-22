import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '../contexts/AuthContext'
import { LanguageSwitcher } from './LanguageSwitcher'

const NAV_LINKS = [
  { href: '/dashboard', labelKey: 'dashboard' },
  { href: '/items', labelKey: 'items' },
  { href: '/settings', labelKey: 'settings' },
] as const

export function AppHeader() {
  const t = useTranslations('Nav')
  const { logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  function handleSignOut() {
    logout()
    router.push('/signin')
  }

  return (
    <header className="app-header">
      <nav className="app-nav">
        {NAV_LINKS.map(({ href, labelKey }) => (
          <a
            key={href}
            href={href}
            className={`app-nav-link${pathname === href ? ' app-nav-link-active' : ''}`}
          >
            {t(labelKey)}
          </a>
        ))}
      </nav>
      <div className="app-header-actions">
        <LanguageSwitcher />
        <button className="btn-ghost" onClick={handleSignOut}>
          {t('signOut')}
        </button>
      </div>
    </header>
  )
}
