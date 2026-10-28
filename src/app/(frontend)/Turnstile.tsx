'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'

type TurnstileApi = { render: (el: HTMLElement, opts: { sitekey: string }) => string; remove: (id: string) => void }
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

// Draws the Turnstile box inside a form. It adds a hidden "cf-turnstile-response" field the server checks.
export function Turnstile({ siteKey }: { siteKey: string }) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)

  const draw = () => {
    if (!siteKey || !box.current || !window.turnstile || widget.current) return
    widget.current = window.turnstile.render(box.current, { sitekey: siteKey })
  }

  useEffect(() => {
    draw()
    return () => {
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current)
      widget.current = null
    }
  })

  if (!siteKey) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={draw} />
      <div ref={box} />
    </>
  )
}
