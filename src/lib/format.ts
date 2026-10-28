export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

// "Example Markets Ltd" -> "EM"
export const initials = (name: string) => {
  const words = name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w) && !/^(ltd|limited|llc|plc|pjsc|psc|fze|fzco|fz|dmcc|the|of|and|n\.?v\.?|s\.?a\.?|inc|co)$/i.test(w))
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? words[0]?.[1] ?? '')).toUpperCase()
}

export const domainOf = (url?: string | null) => {
  if (!url) return ''
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export const fmtMonth = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''

// Splits "a; b; c" from the workbook into a clean list.
export const splitList = (v: unknown): string[] =>
  String(v ?? '')
    .split(/;|\n/)
    .map((s) => s.trim())
    .filter(Boolean)
