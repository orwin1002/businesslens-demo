// Query-string helpers. Lists travel as comma-separated values (?country=AE,SA) so every filter combination has one short URL.
export type SP = Record<string, string | undefined>
export type PageProps = { searchParams: Promise<SP> }

export const list = (v?: string) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [])

export function withParams(path: string, sp: SP, changes: SP) {
  const next = new URLSearchParams()
  for (const [k, v] of Object.entries({ ...sp, ...changes })) if (v) next.set(k, v)
  const qs = next.toString()
  return qs ? `${path}?${qs}` : path
}

// Adds or removes one value of a list parameter.
export const toggle = (current: string | undefined, value: string) => {
  const items = list(current)
  return (items.includes(value) ? items.filter((i) => i !== value) : [...items, value]).join(',') || undefined
}
