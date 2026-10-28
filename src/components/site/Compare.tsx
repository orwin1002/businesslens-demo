'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// Compare tray: remembers up to three companies in this browser.
type Item = { slug: string; name: string }
const KEY = 'bl-compare'
const read = (): Item[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}
const write = (items: Item[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
  window.dispatchEvent(new Event('bl-compare'))
}

function useCompare() {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => {
    const sync = () => setItems(read())
    sync()
    window.addEventListener('bl-compare', sync)
    return () => window.removeEventListener('bl-compare', sync)
  }, [])
  return items
}

export function CompareButton({ slug, name }: { slug: string; name: string }) {
  const items = useCompare()
  const on = items.some((i) => i.slug === slug)
  const full = items.length >= 3 && !on
  return (
    <button
      type="button"
      className="btn secondary small"
      disabled={full}
      title={full ? 'You can compare up to 3 companies' : undefined}
      onClick={() => write(on ? items.filter((i) => i.slug !== slug) : [...items, { slug, name }])}
    >
      {on ? '✓ Comparing' : '+ Compare'}
    </button>
  )
}

export function CompareTray() {
  const items = useCompare()
  if (!items.length) return null
  return (
    <div className="tray" role="region" aria-label="Compare">
      <strong style={{ fontSize: 14 }}>Compare:</strong>
      {items.map((i) => (
        <span key={i.slug} className="chip">
          {i.name.slice(0, 28)}
          <button className="x" aria-label={`Remove ${i.name}`} onClick={() => write(items.filter((x) => x.slug !== i.slug))}>✕</button>
        </span>
      ))}
      {items.length < 3 && <span className="tiny" style={{ opacity: 0.7 }}>+ add up to {3 - items.length} more</span>}
      <Link className="btn small accent" style={{ marginInlineStart: 'auto' }} href={`/compare?ids=${items.map((i) => i.slug).join(',')}`}>
        Compare {items.length}
      </Link>
    </div>
  )
}
