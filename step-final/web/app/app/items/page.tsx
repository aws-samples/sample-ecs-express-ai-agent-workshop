'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '../../contexts/AuthContext'
import { AppHeader } from '../../components/AppHeader'
import { Item, getItems, createItem, deleteItem } from '../../lib/api'

export default function ItemsPage() {
  const t = useTranslations('Items')
  const { user, accessToken, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [items, setItems] = useState<Item[]>([])
  const [newName, setNewName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/signin?callbackUrl=${pathname}`)
    }
  }, [user, loading, router, pathname])

  useEffect(() => {
    if (!loading && user && accessToken) {
      getItems(accessToken).then(setItems).catch(() => {})
    }
  }, [loading, user, accessToken])

  if (loading || !user) return null

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name || !accessToken) return
    setSubmitting(true)
    setError(null)
    try {
      const item = await createItem(accessToken, name)
      setItems((prev) => [item, ...prev])
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return
    try {
      await deleteItem(accessToken, id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFallback'))
    }
  }

  return (
    <div className="dashboard">
      <AppHeader />

      <main className="dashboard-body">
        <form className="items-form" onSubmit={handleAdd}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('namePlaceholder')}
            disabled={submitting}
          />
          <button className="btn-primary" type="submit" disabled={submitting || !newName.trim()}>
            {submitting ? t('adding') : t('add')}
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}

        <ul className="items-list">
          {items.length === 0 ? (
            <li className="items-empty">{t('empty')}</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="item-row">
                <span className="item-name">{item.name}</span>
                <button className="btn-danger" onClick={() => handleDelete(item.id)}>
                  {t('delete')}
                </button>
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  )
}
