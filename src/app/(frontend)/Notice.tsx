// Shows ?message= and ?error= from the address bar after a form is sent.
export function Notice({ message, error }: { message?: string; error?: string }) {
  return (
    <>
      {message && <p className="notice ok">{message}</p>}
      {error && <p className="notice err">{error}</p>}
    </>
  )
}

export type PageProps = {
  searchParams: Promise<{ message?: string; error?: string; token?: string; q?: string }>
}
