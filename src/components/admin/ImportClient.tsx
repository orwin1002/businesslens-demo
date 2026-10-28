'use client'

import { useState } from 'react'

type Issue = { row: number; entityId: string; level: 'error' | 'warning'; message: string }
type Plan = { row: number; data: Record<string, string>; licences: unknown[]; action: string; existingId?: number }
type Preview = {
  entities: Plan[]
  issues: Issue[]
  counts: { rows: number; create: number; update: number; skipEdited: number; invalid: number; licences: number }
}

const CHUNK = 20

export function ImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [overwrite, setOverwrite] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ created: number; updated: number; skipped: number; errors: string[]; indexed?: number; warning?: string } | null>(null)
  const [progress, setProgress] = useState(0)

  const check = async () => {
    if (!file) return
    setBusy('Checking the file...')
    setError('')
    setPreview(null)
    setDone(null)
    const body = new FormData()
    body.append('file', file)
    const res = await fetch('/import-api/preview', { method: 'POST', body })
    const json = await res.json()
    setBusy('')
    if (!res.ok) return setError(json.error)
    setPreview(json)
  }

  const run = async () => {
    if (!preview || !file) return
    const todo = preview.entities.filter((p) => p.action === 'create' || p.action === 'update' || (overwrite && p.action === 'skip-edited'))
    const tally = { created: 0, updated: 0, skipped: 0, errors: [] as string[] }
    setDone(null)
    for (let i = 0; i < todo.length; i += CHUNK) {
      setBusy(`Importing ${Math.min(i + CHUNK, todo.length)} of ${todo.length}...`)
      setProgress(Math.round((i / todo.length) * 100))
      const res = await fetch('/import-api/commit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plans: todo.slice(i, i + CHUNK), overwrite }),
      })
      if (!res.ok) {
        tally.errors.push(`Chunk starting at ${i + 1} failed (${res.status})`)
        continue
      }
      const { results } = (await res.json()) as { results: { entityId: string; result: string }[] }
      for (const r of results) {
        if (r.result === 'created') tally.created++
        else if (r.result === 'updated') tally.updated++
        else if (r.result === 'skipped') tally.skipped++
        else tally.errors.push(`${r.entityId}: ${r.result}`)
      }
    }
    setProgress(100)
    setBusy('Updating the search index...')
    const fin = await fetch('/import-api/finish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, summary: `${tally.created} created, ${tally.updated} updated, ${tally.errors.length} errors` }),
    }).then((r) => r.json())
    setBusy('')
    setDone({ ...tally, indexed: fin.indexed, warning: fin.warning })
  }

  const cell: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid var(--theme-elevation-100)', textAlign: 'left', verticalAlign: 'top' }
  const errors = preview?.issues.filter((i) => i.level === 'error') ?? []
  const warnings = preview?.issues.filter((i) => i.level === 'warning') ?? []

  return (
    <div style={{ maxWidth: 1000, paddingBottom: 60 }}>
      <p>
        Upload the batch workbook in the agreed template: an <strong>Entities</strong> tab (one row per company) and a <strong>Licences</strong> tab.
        Companies are matched by <code>entity_id</code>: new IDs are created, known IDs are updated. Nothing is written until you press Import.
      </p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '16px 0' }}>
        <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="button" className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }} disabled={!file || Boolean(busy)} onClick={check}>
          1. Check file
        </button>
      </div>
      {busy && <p><strong>{busy}</strong> {progress > 0 && progress < 100 && `${progress}%`}</p>}
      {error && <p style={{ color: 'var(--theme-error-500)' }}>{error}</p>}

      {preview && (
        <>
          <h2>Validation report</h2>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', margin: '8px 0 16px' }}>
            <span>{preview.counts.rows} companies in file</span>
            <span style={{ color: '#15803d' }}>{preview.counts.create} new</span>
            <span style={{ color: '#1d4ed8' }}>{preview.counts.update} updates</span>
            <span style={{ color: '#b45309' }}>{preview.counts.skipEdited} edited since last import</span>
            <span style={{ color: '#b91c1c' }}>{preview.counts.invalid} with errors (skipped)</span>
            <span>{preview.counts.licences} licences</span>
          </div>
          {preview.counts.skipEdited > 0 && (
            <label style={{ display: 'block', marginBottom: 12 }}>
              <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> Overwrite companies edited in the admin since the last import
            </label>
          )}
          <button type="button" className="btn btn--style-primary btn--size-medium" style={{ margin: '0 0 20px' }} disabled={Boolean(busy)} onClick={run}>
            2. Import {preview.counts.create + preview.counts.update + (overwrite ? preview.counts.skipEdited : 0)} companies
          </button>
          {[{ title: `Errors (${errors.length})`, list: errors }, { title: `Warnings (${warnings.length})`, list: warnings }].map(({ title, list }) =>
            list.length ? (
              <details key={title} open={title.startsWith('Errors')} style={{ marginBottom: 16 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{title}</summary>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead><tr><th style={cell}>Row</th><th style={cell}>Entity</th><th style={cell}>Issue</th></tr></thead>
                  <tbody>
                    {list.slice(0, 300).map((i, n) => (
                      <tr key={n}><td style={cell}>{i.row}</td><td style={cell}>{i.entityId}</td><td style={cell}>{i.message}</td></tr>
                    ))}
                  </tbody>
                </table>
                {list.length > 300 && <p>…and {list.length - 300} more.</p>}
              </details>
            ) : null,
          )}
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Preview first 20 rows</summary>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead><tr><th style={cell}>ID</th><th style={cell}>Legal name</th><th style={cell}>Category</th><th style={cell}>Country</th><th style={cell}>Licences</th><th style={cell}>Action</th></tr></thead>
              <tbody>
                {preview.entities.slice(0, 20).map((p) => (
                  <tr key={p.row}>
                    <td style={cell}>{p.data.entity_id}</td><td style={cell}>{p.data.legal_name}</td><td style={cell}>{p.data.primary_category}</td>
                    <td style={cell}>{p.data.hq_country}</td><td style={cell}>{p.licences.length}</td><td style={cell}>{p.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}

      {done && (
        <div style={{ marginTop: 24, padding: 16, border: '1px solid var(--theme-success-500)', borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>Import finished</h2>
          <p>{done.created} created · {done.updated} updated · {done.skipped} skipped · {done.errors.length} errors · {done.indexed ?? 0} companies in search</p>
          {done.warning && <p style={{ color: '#b45309' }}>{done.warning}</p>}
          {done.errors.slice(0, 50).map((e) => <div key={e} style={{ color: 'var(--theme-error-500)' }}>{e}</div>)}
          <p><a href="/admin/collections/companies">Open companies</a> · <a href="/search" target="_blank">See them on the site</a></p>
        </div>
      )}
    </div>
  )
}
