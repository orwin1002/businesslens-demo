import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="wrap section">
      <h1>Page not found</h1>
      <p>The page may have moved, or the company may no longer be listed.</p>
      <p><Link href="/search" className="btn">Search the directory</Link></p>
    </div>
  )
}
