'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Suggestion = { slug: string; name: string; initials: string; logoUrl?: string; meta: string; why?: string }
type Option = { value: string; label: string }

// Search field with suggestions after 2 characters: companies, brands, licence numbers, LEIs.
export function SearchBox({
  defaultValue = '',
  placeholder = 'Search a company, brand, licence number or LEI…',
  hero = false,
  categories = [],
  countries = [],
  compact = false,
}: {
  defaultValue?: string
  placeholder?: string
  hero?: boolean
  categories?: Option[]
  countries?: Option[]
  compact?: boolean
}) {
  const router = useRouter()
  const [q, setQ] = useState(defaultValue)
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const lookup = (value: string) => {
    setQ(value)
    setActive(-1)
    if (timer.current) clearTimeout(timer.current)
    if (value.trim().length < 2) {
      setItems([])
      return
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/search/suggest?q=${encodeURIComponent(value.trim())}`)
        const data = (await res.json()) as { hits: Suggestion[] }
        setItems(data.hits)
        setOpen(true)
      } catch {
        setItems([])
      }
    }, 120)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || !items.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(items.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(-1, a - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      setOpen(false)
      router.push(`/company/${items[active].slug}`)
    } else if (e.key === 'Escape') setOpen(false)
  }

  const field = (
    <div className="ac" ref={box}>
      <label className="sr-only" htmlFor={hero ? 'q-hero' : 'q-top'}>Search</label>
      <input
        id={hero ? 'q-hero' : 'q-top'}
        name="q"
        value={q}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => lookup(e.target.value)}
        onFocus={() => items.length && setOpen(true)}
        onKeyDown={onKey}
        role="combobox"
        aria-expanded={open}
        aria-controls="ac-list"
        style={compact ? { height: 40, background: '#f4f6fa', border: '1px solid var(--line)' } : undefined}
      />
      {open && items.length > 0 && (
        <ul className="ac-list" id="ac-list" role="listbox">
          {items.map((s, i) => (
            <li key={s.slug} className={i === active ? 'on' : ''} role="option" aria-selected={i === active}>
              <a href={`/company/${s.slug}`} onClick={() => setOpen(false)}>
                <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                  {s.logoUrl ? <img src={s.logoUrl} alt="" /> : s.initials}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600 }}>{s.name}</span>
                  <span className="why">{s.meta}{s.why ? ` · matched ${s.why}` : ''}</span>
                </span>
              </a>
            </li>
          ))}
          <li>
            <a href={`/search?q=${encodeURIComponent(q)}`} onClick={() => setOpen(false)}>
              <span className="why">See all results for “{q}” ›</span>
            </a>
          </li>
        </ul>
      )}
    </div>
  )

  if (!hero)
    return (
      <form action="/search" role="search">
        {field}
      </form>
    )
  return (
    <form action="/search" className="searchpanel" role="search">
      {field}
      <select name="category" aria-label="Category" defaultValue="">
        <option value="">Any category</option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <select name="country" aria-label="Country" defaultValue="">
        <option value="">Any country</option>
        {countries.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <button className="btn">Search</button>
    </form>
  )
}

// Shows the compact header search once the visitor scrolls past the homepage hero; always on other pages.
export function HeaderSearchToggle() {
  const path = usePathname()
  useEffect(() => {
    const onScroll = () => document.body.classList.toggle('scrolled', path !== '/' || window.scrollY > 320)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [path])
  // Close any open menu after navigation.
  useEffect(() => {
    document.querySelectorAll('details.mega[open], details.burger[open]').forEach((d) => d.removeAttribute('open'))
  }, [path])
  return null
}
