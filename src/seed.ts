import type { Payload, PayloadRequest } from 'payload'

// Made-up firms so the demo has something to show. None of these are real.
const FIRMS = [
  { name: 'Demo Capital Markets Ltd', regulator: 'DFSA', licenceNumber: 'F000001', country: 'United Arab Emirates', category: 'Brokerage', website: 'https://example.com' },
  { name: 'Sample Gulf Bank PJSC', regulator: 'CBUAE', licenceNumber: 'B000002', country: 'United Arab Emirates', category: 'Bank', website: 'https://example.com' },
  { name: 'Example Wealth Advisors', regulator: 'FSRA', licenceNumber: 'W000003', country: 'United Arab Emirates', category: 'Wealth management', website: 'https://example.com' },
  { name: 'Placeholder Crypto Exchange FZE', regulator: 'VARA', licenceNumber: 'V000004', country: 'United Arab Emirates', category: 'Virtual assets', website: 'https://example.com' },
  { name: 'Test Insurance Brokers LLC', regulator: 'CMA', licenceNumber: 'I000005', country: 'United Arab Emirates', category: 'Insurance', website: 'https://example.com' },
  { name: 'Mock Riyadh Securities', regulator: 'CMA (KSA)', licenceNumber: 'S000006', country: 'Saudi Arabia', category: 'Brokerage', website: 'https://example.com' },
]

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export async function seed(payload: Payload, req?: PayloadRequest) {
  const { totalDocs } = await payload.count({ collection: 'firms', req })
  if (totalDocs > 0) return
  payload.logger.info('Adding demo firms...')
  for (const firm of FIRMS) {
    await payload.create({
      collection: 'firms',
      req,
      data: {
        ...firm,
        slug: slugify(firm.name),
        description: `${firm.name} is a made-up firm used to test the BusinessLens demo.`,
      },
    })
  }
}
