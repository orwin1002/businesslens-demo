import ExcelJS from 'exceljs'
import type { Payload } from 'payload'

import { COUNTRIES } from './countries'
import { domainOf, slugify, splitList } from './format'

// Reads the batch workbook (Appendix A template: "Entities" and "Licences" tabs),
// checks it, and writes it to the database in small chunks.

export type Row = Record<string, string>
export type Issue = { row: number; entityId: string; level: 'error' | 'warning'; message: string }
export type EntityPlan = {
  row: number
  data: Row
  licences: Row[]
  action: 'create' | 'update' | 'skip-edited' | 'invalid'
  existingId?: number
}
export type Preview = {
  entities: EntityPlan[]
  issues: Issue[]
  counts: { rows: number; create: number; update: number; skipEdited: number; invalid: number; licences: number }
}

const REQUIRED = ['entity_id', 'legal_name', 'primary_category', 'hq_country', 'short_description']
const LICENCE_REQUIRED = ['entity_id', 'regulator', 'licence_number']

const cellText = (v: unknown): string => {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object') {
    const o = v as { text?: unknown; result?: unknown; richText?: { text: string }[]; hyperlink?: string }
    if (o.richText) return o.richText.map((r) => r.text).join('')
    if (o.text != null) return cellText(o.text)
    if (o.result != null) return cellText(o.result)
    if (o.hyperlink) return o.hyperlink
    return ''
  }
  return String(v).trim()
}

function sheetRows(ws: ExcelJS.Worksheet | undefined): { row: number; data: Row }[] {
  if (!ws) return []
  const header = (ws.getRow(1).values as unknown[]).map((h) => cellText(h).toLowerCase())
  const out: { row: number; data: Row }[] = []
  ws.eachRow((r, n) => {
    if (n === 1) return
    const vals = r.values as unknown[]
    const data: Row = {}
    header.forEach((h, i) => {
      if (h) data[h] = cellText(vals[i])
    })
    if (Object.values(data).some(Boolean)) out.push({ row: n, data })
  })
  return out
}

export async function previewWorkbook(payload: Payload, buffer: ArrayBuffer): Promise<Preview> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const find = (name: string) => wb.worksheets.find((w) => w.name.toLowerCase().startsWith(name))
  const entities = sheetRows(find('entit'))
  const licences = sheetRows(find('licen'))
  const issues: Issue[] = []
  if (!entities.length) issues.push({ row: 0, entityId: '', level: 'error', message: 'No "Entities" tab found, or it is empty.' })

  // What is already in the database, for update-by-ID and duplicate checks.
  const { docs: existing } = await payload.find({
    collection: 'companies',
    limit: 0,
    pagination: false,
    depth: 0,
    select: { entityId: true, legalName: true, lei: true, website: true, editedSinceImport: true },
  })
  const byId = new Map(existing.filter((c) => c.entityId).map((c) => [c.entityId!, c]))
  const byName = new Map(existing.map((c) => [c.legalName.toLowerCase(), c]))
  const byLei = new Map(existing.filter((c) => c.lei).map((c) => [c.lei!.toUpperCase(), c]))
  const byDomain = new Map(existing.filter((c) => c.website).map((c) => [domainOf(c.website), c]))

  const { docs: cats } = await payload.find({ collection: 'categories', limit: 0, pagination: false, depth: 0 })
  const catNames = new Set(cats.filter((c) => !c.parent).map((c) => c.name.toLowerCase()))

  // A missing HQ country can be taken from the company's licence (the regulator's country).
  const licenceCountry = new Map<string, string>()
  for (const { data } of licences) {
    const j = (data.jurisdiction ?? '').toUpperCase().slice(0, 2)
    if (data.entity_id && COUNTRIES[j] && !licenceCountry.has(data.entity_id)) licenceCountry.set(data.entity_id, j)
  }

  const seen = new Set<string>()
  const plans: EntityPlan[] = []
  for (const { row, data } of entities) {
    const eid = data.entity_id
    const add = (level: Issue['level'], message: string) => issues.push({ row, entityId: eid, level, message })
    if (!data.hq_country && licenceCountry.has(eid)) {
      data.hq_country = licenceCountry.get(eid)!
      add('warning', `No hq_country: used the licence country (${data.hq_country})`)
    }
    const missing = REQUIRED.filter((f) => !data[f])
    if (missing.length) add('error', `Missing required field(s): ${missing.join(', ')}`)
    if (eid && seen.has(eid)) add('error', 'Duplicate entity_id in this file')
    seen.add(eid)
    if (data.hq_country && !COUNTRIES[data.hq_country.toUpperCase()]) add('warning', `Unknown country code "${data.hq_country}"`)
    if (data.primary_category && !catNames.has(data.primary_category.toLowerCase())) add('error', `Unknown category "${data.primary_category}"`)
    if (data.short_description && data.short_description.split(/\s+/).length > 160) add('warning', 'Description is longer than 120 words')
    if (!data.website) add('warning', 'No website')

    const current = eid ? byId.get(eid) : undefined
    if (!current) {
      const dup =
        byName.get((data.legal_name ?? '').toLowerCase()) ??
        (data.lei ? byLei.get(data.lei.toUpperCase()) : undefined) ??
        (data.website ? byDomain.get(domainOf(data.website)) : undefined)
      if (dup) add('warning', `Possible duplicate of existing "${dup.legalName}" (${dup.entityId ?? 'no ID'})`)
    }
    const hasError = issues.some((i) => i.row === row && i.level === 'error')
    const action: EntityPlan['action'] = hasError ? 'invalid' : !current ? 'create' : current.editedSinceImport ? 'skip-edited' : 'update'
    if (action === 'skip-edited') add('warning', 'Edited in the admin since the last import; will be skipped unless you tick "overwrite"')
    plans.push({ row, data, licences: [], action, existingId: current?.id })
  }

  const planById = new Map(plans.map((p) => [p.data.entity_id, p]))
  for (const { row, data } of licences) {
    const missing = LICENCE_REQUIRED.filter((f) => !data[f])
    if (missing.length) {
      issues.push({ row, entityId: data.entity_id, level: 'error', message: `Licences tab: missing ${missing.join(', ')}` })
      continue
    }
    const plan = planById.get(data.entity_id)
    if (!plan) {
      issues.push({ row, entityId: data.entity_id, level: 'warning', message: 'Licences tab: entity_id not found in Entities tab' })
      continue
    }
    if (!data.register_url) issues.push({ row, entityId: data.entity_id, level: 'warning', message: 'Licences tab: no register_url' })
    plan.licences.push(data)
  }

  return {
    entities: plans,
    issues,
    counts: {
      rows: plans.length,
      create: plans.filter((p) => p.action === 'create').length,
      update: plans.filter((p) => p.action === 'update').length,
      skipEdited: plans.filter((p) => p.action === 'skip-edited').length,
      invalid: plans.filter((p) => p.action === 'invalid').length,
      licences: plans.reduce((s, p) => s + p.licences.length, 0),
    },
  }
}

const num = (v?: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : null)
const date = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)

export async function commitChunk(payload: Payload, plans: EntityPlan[], overwrite: boolean) {
  const { docs: cats } = await payload.find({ collection: 'categories', limit: 0, pagination: false, depth: 0 })
  const catByName = new Map(cats.map((c) => [`${c.parent ? (typeof c.parent === 'object' ? c.parent.id : c.parent) : 0}:${c.name.toLowerCase()}`, c.id]))
  const { docs: regs } = await payload.find({ collection: 'regulators', limit: 0, pagination: false, depth: 0 })
  const regByCode = new Map(regs.map((r) => [r.code.toUpperCase(), r.id]))
  const ctx = { import: true }
  const results: { entityId: string; result: string; id?: number }[] = []

  for (const plan of plans) {
    const d = plan.data
    if (plan.action === 'invalid' || (plan.action === 'skip-edited' && !overwrite)) {
      results.push({ entityId: d.entity_id, result: 'skipped' })
      continue
    }
    try {
      const primary = catByName.get(`0:${d.primary_category.toLowerCase()}`)
      const subs: number[] = []
      for (const name of splitList(d.sub_categories)) {
        let sub = catByName.get(`${primary}:${name.toLowerCase()}`)
        if (!sub && primary) {
          const created = await payload.create({ collection: 'categories', data: { name, slug: slugify(name), parent: primary }, context: ctx }).catch(async () =>
            payload.create({ collection: 'categories', data: { name, slug: `${slugify(name)}-${primary}`, parent: primary }, context: ctx }),
          )
          sub = created.id
          catByName.set(`${primary}:${name.toLowerCase()}`, sub)
        }
        if (sub) subs.push(sub)
      }
      const data = {
        entityId: d.entity_id,
        legalName: d.legal_name,
        groupId: d.group_id || null,
        brandNames: splitList(d.brand_names).map((name) => ({ name })),
        formerNames: splitList(d.former_names).map((name) => ({ name })),
        primaryCategory: primary,
        subCategories: subs,
        hqCountry: d.hq_country?.toUpperCase().slice(0, 2) || null,
        operatingCountries: splitList(d.operating_countries).map((code) => ({ code: code.toUpperCase().slice(0, 2) })),
        website: d.website || null,
        arabicWebsite: d.arabic_website === 'Y',
        lei: d.lei || null,
        yearFounded: num(d.year_founded),
        registeredAddress: d.registered_address || null,
        officeLocations: d.office_locations || null,
        keyPeople: d.key_people || null,
        employeeRange: d.employee_range || null,
        shortDescription: d.short_description,
        productsServices: d.products_services || null,
        platforms: d.platforms || null,
        minDepositUsd: num(d.min_deposit_usd),
        clientTypes: d.client_types || null,
        languages: d.languages || null,
        publicEmail: d.public_email || null,
        phone: d.phone || null,
        socialLinks: d.social_links || null,
        listedOn: d.listed_on || null,
        warningFlag: d.warning_flag === 'Y',
        priority: num(d.priority),
        confidence: (['High', 'Medium', 'Low'].includes(d.confidence) ? d.confidence : null) as 'High' | 'Medium' | 'Low' | null,
        sources: d.sources || null,
        dateVerified: date(d.date_collected),
        notes: d.notes || null,
        editedSinceImport: false,
        lastImportedAt: new Date().toISOString(),
      }
      let companyId = plan.existingId
      if (companyId) {
        await payload.update({ collection: 'companies', id: companyId, data, context: ctx, overrideAccess: true })
      } else {
        let slug = slugify(d.legal_name)
        const taken = await payload.count({ collection: 'companies', where: { slug: { equals: slug } } })
        if (taken.totalDocs) slug = `${slug}-${slugify(d.entity_id)}`
        const created = await payload.create({ collection: 'companies', data: { ...data, slug, tier: 'standard', ratingState: 'not_rated' }, context: ctx, overrideAccess: true })
        companyId = created.id
      }

      for (const l of plan.licences) {
        const code = l.regulator.toUpperCase()
        let regId = regByCode.get(code)
        if (!regId) {
          const created = await payload.create({ collection: 'regulators', data: { code: l.regulator, slug: slugify(l.regulator), name: l.regulator, country: l.jurisdiction || null }, context: ctx })
          regId = created.id
          regByCode.set(code, regId)
        }
        const licData = {
          company: companyId,
          regulator: regId,
          licenceNumber: l.licence_number,
          jurisdiction: l.jurisdiction?.toUpperCase().slice(0, 2) || null,
          licenceType: l.licence_type || l.activities || null,
          status: (['Active', 'Suspended', 'Withdrawn', 'Unknown'].includes(l.status) ? l.status : 'Unknown') as 'Active',
          dateGranted: date(l.date_granted),
          dateChecked: date(l.date_checked),
          registerUrl: l.register_url || null,
        }
        const { docs: same } = await payload.find({
          collection: 'licences',
          where: { company: { equals: companyId }, regulator: { equals: regId }, licenceNumber: { equals: l.licence_number } },
          limit: 1,
          depth: 0,
        })
        if (same[0]) await payload.update({ collection: 'licences', id: same[0].id, data: licData, context: ctx })
        else await payload.create({ collection: 'licences', data: licData, context: ctx })
      }
      results.push({ entityId: d.entity_id, result: plan.existingId ? 'updated' : 'created', id: companyId })
    } catch (err) {
      results.push({ entityId: d.entity_id, result: `error: ${err instanceof Error ? err.message : String(err)}` })
    }
  }
  return results
}
