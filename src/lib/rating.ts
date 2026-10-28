// Rating maths. BusinessLens analysts enter sub-scores; everything here is derived from them.
export type Criterion = { name: string; maxPoints: number; description?: string | null }
export type Band = { minScore: number; label: string; color: string }
export type Score = { criterion: string; max: number; score?: number | null }

export const DEFAULT_CRITERIA: Criterion[] = [
  { name: 'Regulatory & compliance', maxPoints: 30, description: 'Licence validity and the quality of the regulators that supervise the firm.' },
  { name: 'Company & founders profile', maxPoints: 20, description: 'Verified ownership, history and track record of the company and its founders.' },
  { name: 'Team strength & capability', maxPoints: 20, description: 'Experience and depth of the management and control functions.' },
  { name: 'Operational set-up', maxPoints: 15, description: 'Physical presence, systems, infrastructure and client-money arrangements.' },
  { name: 'Public record', maxPoints: 15, description: 'Complaints, disputes, enforcement actions and compliance history.' },
]

export const DEFAULT_BANDS: Band[] = [
  { minScore: 0, label: 'Developing', color: '#b45309' },
  { minScore: 5.5, label: 'Established', color: '#1d4ed8' },
  { minScore: 7, label: 'Strong', color: '#15803d' },
  { minScore: 8.5, label: 'Top tier', color: '#065f46' },
]

export const overallFrom = (scores: Score[]) => {
  const max = scores.reduce((s, c) => s + (c.max || 0), 0)
  const got = scores.reduce((s, c) => s + (Number(c.score) || 0), 0)
  return max ? Math.round((got / max) * 100) / 10 : 0
}

export const bandFor = (overall: number, bands: Band[] = DEFAULT_BANDS) =>
  [...bands].sort((a, b) => b.minScore - a.minScore).find((b) => overall >= b.minScore) ?? bands[0]

export const RATING_STATES = [
  { label: 'Not yet rated', value: 'not_rated' },
  { label: 'Under review', value: 'under_review' },
  { label: 'Rated', value: 'rated' },
  { label: 'Rating suspended', value: 'suspended' },
]
