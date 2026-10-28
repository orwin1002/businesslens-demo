import type { Payload, PayloadRequest } from 'payload'

import { slugify } from '../lib/format'
import { DEFAULT_BANDS, DEFAULT_CRITERIA } from '../lib/rating'
import { HOME, INSIGHTS, PAGES } from './content'
import { EXAMPLES, PARTNER_EXTRA } from './examples'
import { CATEGORIES, REGULATORS } from './taxonomy'

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
const monthsAgo = (n: number) => daysAgo(n * 30)

// Fills a new database with everything the demo needs except the real firms (those come from the Excel import).
export async function seedDemo(payload: Payload, req?: PayloadRequest) {
  const ctx = { import: true, skipAudit: true, system: true }
  const opts = { req, overrideAccess: true, context: ctx }
  if ((await payload.count({ collection: 'categories', req })).totalDocs > 0) return

  // Taxonomy.
  const cat = new Map<string, number>()
  for (const [i, c] of CATEGORIES.entries()) {
    const main = await payload.create({ collection: 'categories', data: { name: c.name, slug: c.slug, intro: c.intro, order: i, laterPhase: c.laterPhase ?? false }, ...opts })
    cat.set(c.name, main.id)
    for (const [j, s] of c.subs.entries()) {
      const sub = await payload.create({ collection: 'categories', data: { name: s, slug: slugify(s), parent: main.id, order: j }, ...opts })
      cat.set(`${c.name}:${s}`, sub.id)
    }
  }
  const reg = new Map<string, number>()
  for (const [i, r] of REGULATORS.entries()) {
    const doc = await payload.create({ collection: 'regulators', data: { ...r, slug: slugify(r.code), order: i, registerLastChecked: '2026-10-19' }, ...opts })
    reg.set(r.code, doc.id)
  }

  const methodology = await payload.create({
    collection: 'methodologies',
    data: { title: 'Standard methodology', version: '1.0', isDefault: true, criteria: DEFAULT_CRITERIA, bands: DEFAULT_BANDS },
    ...opts,
  })

  // Content.
  await payload.updateGlobal({ slug: 'home', data: HOME, ...opts })
  for (const p of PAGES) await payload.create({ collection: 'pages', data: p as never, ...opts })
  for (const [i, a] of INSIGHTS.entries()) await payload.create({ collection: 'insights', data: { ...a, publishedAt: daysAgo(5 + i * 9) } as never, ...opts })

  // Example companies, their licences, rating history and reviews.
  for (const ex of EXAMPLES) {
    const company = await payload.create({
      collection: 'companies',
      data: {
        legalName: ex.name,
        slug: ex.slug,
        entityId: `EX-${ex.slug.slice(0, 20)}`,
        isExample: true,
        primaryCategory: cat.get(ex.category),
        subCategories: ex.subs.map((s) => cat.get(`${ex.category}:${s}`)).filter(Boolean) as number[],
        hqCountry: ex.country,
        operatingCountries: (ex.operating ?? []).map((code) => ({ code })),
        brandNames: (ex.brands ?? []).map((name) => ({ name })),
        groupId: ex.groupId ?? null,
        website: ex.website,
        yearFounded: ex.founded ?? null,
        minDepositUsd: ex.minDeposit ?? null,
        platforms: ex.platforms ?? null,
        productsServices: ex.products ?? null,
        languages: ex.languages ?? null,
        shortDescription: ex.description,
        tier: ex.tier,
        tierStart: ex.tier === 'standard' ? null : daysAgo(60),
        logoUrl: ex.tier === 'claimed' ? '/demo/example-logo.svg' : null,
        ...(ex.tier === 'partner' ? PARTNER_EXTRA : {}),
        confidence: 'High',
        priority: 1,
        dateVerified: '2026-10-19',
        sources: 'Made-up example for the demo',
        listedOn: 'none',
      },
      ...opts,
    })
    for (const l of ex.licences) {
      await payload.create({
        collection: 'licences',
        data: {
          company: company.id,
          regulator: reg.get(l.reg)!,
          licenceNumber: l.number,
          licenceType: l.type,
          jurisdiction: REGULATORS.find((r) => r.code === l.reg)?.country ?? null,
          status: (l.status ?? 'Active') as 'Active',
          registerUrl: REGULATORS.find((r) => r.code === l.reg)?.registerUrl ?? null,
          dateChecked: '2026-10-19',
        },
        ...opts,
      })
    }
    for (const h of ex.history ?? []) {
      await payload.create({
        collection: 'ratings',
        data: {
          company: company.id,
          methodology: methodology.id,
          status: 'published',
          state: 'rated',
          scores: DEFAULT_CRITERIA.map((c, i) => ({
            criterion: c.name,
            max: c.maxPoints,
            score: h.scores[i],
            internalNote: 'Demo note visible to analysts only.',
            shareableNote: i === 2 ? 'Adding a second senior compliance officer would strengthen this criterion.' : null,
          })),
          reason: h.reason,
          publishedAt: new Date(h.date).toISOString(),
        },
        ...opts,
      })
    }
    if (ex.finalState) {
      await payload.create({
        collection: 'ratings',
        data: { company: company.id, methodology: methodology.id, status: 'published', state: ex.finalState, reason: ex.stateNote ?? '', publicNote: ex.stateNote, publishedAt: daysAgo(4) },
        ...opts,
      })
    }
    for (const r of ex.reviews ?? []) {
      await payload.create({
        collection: 'reviews',
        data: {
          company: company.id,
          authorName: r.name,
          rating: r.rating,
          title: r.title,
          body: r.body,
          relationship: r.rel,
          verified: Boolean(r.verified),
          helpfulCount: r.helpful ?? 0,
          experienceDate: monthsAgo(r.months + 1),
          status: 'approved',
          replyText: r.reply ?? null,
          replyStatus: r.reply ? 'approved' : 'none',
          replyAt: r.reply ? monthsAgo(r.months - 0.5) : null,
        },
        ...opts,
      })
    }
    if (ex.alert) {
      await payload.create({
        collection: 'alerts',
        data: { title: ex.alert.title, kind: 'regulator', date: daysAgo(25), active: true, regulator: reg.get(ex.alert.reg), company: company.id, namedEntity: ex.name, summary: ex.alert.summary, officialUrl: REGULATORS.find((x) => x.code === ex.alert!.reg)?.alertsUrl },
        ...opts,
      })
    }
    if (ex.tier === 'partner') {
      for (const placement of ['home', 'search', 'category', 'similar'] as const) {
        await payload.create({ collection: 'featured-slots', data: { company: company.id, placement, start: daysAgo(30), end: daysAgo(-335), active: true }, ...opts })
      }
      await payload.create({
        collection: 'leads',
        data: { type: 'callback', company: company.id, name: 'Demo visitor', contact: 'visitor@example.com', interest: 'Open a Pro account', consent: true, status: 'new' },
        ...opts,
      })
    }
  }

  // A BusinessLens notice that isn't tied to one company.
  await payload.create({
    collection: 'alerts',
    data: { title: 'Beware of websites copying licensed brokers', kind: 'notice', date: daysAgo(12), active: true, summary: 'Clone websites copy the name and licence number of a real firm. Always reach a firm through the website listed on the regulator\'s register.' },
    ...opts,
  })
}
