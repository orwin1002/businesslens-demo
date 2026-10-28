// Made-up example companies. They show ratings, reviews, tiers and alerts without inventing
// anything about real firms. Every one is marked isExample and labelled on the site.
type Lic = { reg: string; number: string; type: string; status?: string }
type Hist = { date: string; scores: number[]; reason: string }
type Rev = { name: string; rating: number; title: string; body: string; months: number; rel: 'client' | 'ex_client' | 'partner'; verified?: boolean; helpful?: number; reply?: string }

export type Example = {
  name: string
  slug: string
  category: string
  subs: string[]
  country: string
  operating?: string[]
  brands?: string[]
  groupId?: string
  website: string
  founded?: number
  minDeposit?: number
  platforms?: string
  products?: string
  languages?: string
  tier: 'standard' | 'claimed' | 'partner'
  description: string
  licences: Lic[]
  history?: Hist[]
  finalState?: 'under_review' | 'suspended'
  stateNote?: string
  reviews?: Rev[]
  alert?: { title: string; reg: string; summary: string }
}

export const EXAMPLES: Example[] = [
  {
    name: 'Example Markets Ltd', slug: 'example-markets-ltd', category: 'Brokers', subs: ['FX & CFD brokers'], country: 'AE', operating: ['AE', 'GB'],
    brands: ['EMX', 'Example FX'], groupId: 'GRP-EX-01', website: 'https://example.com', founded: 2015, minDeposit: 200, platforms: 'MT5; own app',
    products: 'FX; indices; commodities; shares CFDs', languages: 'EN; AR', tier: 'claimed',
    description: 'Example Markets Ltd is a made-up brokerage used in this demo. It is shown as authorised by the DFSA in the DIFC to deal in investments as agent and to arrange deals, and as licensed onshore as a trading broker. It offers contracts for difference on currencies, indices and commodities to retail and professional clients through MetaTrader 5 and its own app.',
    licences: [{ reg: 'DFSA', number: 'F00EX01', type: 'Category 3A: dealing in investments as agent; arranging deals' }, { reg: 'SCA', number: 'CP-EX0001', type: 'Trading broker' }],
    history: [
      { date: '2026-01-15', scores: [20, 12, 11, 9, 9], reason: 'First rating' },
      { date: '2026-06-20', scores: [23, 13, 12, 10, 10], reason: 'New compliance officer appointed' },
      { date: '2026-10-12', scores: [25, 14, 14, 11, 10], reason: 'Re-review after new SCA licence' },
    ],
    reviews: [
      { name: 'Omar S.', rating: 4, title: 'Fast withdrawals', body: 'Withdrawals reached my UAE bank account within two working days each time. Spreads on gold are wider during news.', months: 1, rel: 'client', verified: true, helpful: 4 },
      { name: 'Priya N.', rating: 5, title: 'Clear onboarding', body: 'Account opening took one day and the documents requested were explained clearly. Support answered in Arabic and English.', months: 2, rel: 'client', verified: true, helpful: 2 },
      { name: 'Daniel R.', rating: 2, title: 'Slow support', body: 'Waited a week for an answer about a swap charge. The answer was correct but took too long.', months: 3, rel: 'client', helpful: 1, reply: 'Thank you for the feedback. We have since added weekend support hours and now answer swap questions within 24 hours.' },
      { name: 'Layla A.', rating: 4, title: 'Good platform', body: 'The app is stable and the charting is good. Would like more educational material in Arabic.', months: 5, rel: 'client' },
    ],
  },
  {
    name: 'Example Markets (UK) Ltd', slug: 'example-markets-uk-ltd', category: 'Brokers', subs: ['FX & CFD brokers'], country: 'GB', groupId: 'GRP-EX-01', website: 'https://example.com', tier: 'standard',
    description: 'Example Markets (UK) Ltd is the made-up UK entity of the Example Markets group in this demo, shown as authorised by the FCA. It is linked to its UAE sister company through a shared group ID.',
    licences: [{ reg: 'FCA', number: '900000', type: 'Investment firm' }],
  },
  {
    name: 'Partner Brokerage LLC', slug: 'partner-brokerage-llc', category: 'Brokers', subs: ['FX & CFD brokers', 'Securities and equities brokers'], country: 'AE', operating: ['AE', 'SA', 'GB'],
    brands: ['PB Trade'], website: 'https://example.org', founded: 2011, minDeposit: 100, platforms: 'MT5; cTrader; PB Trade app', products: 'FX; indices; shares; ETFs; bonds', languages: 'EN; AR; FR', tier: 'partner',
    description: 'Partner Brokerage LLC is a made-up brokerage that shows the Partner profile layout in this demo. It is shown as licensed by the DFSA, the UAE Capital Market Authority and the FCA, and offers trading in currencies, shares and exchange-traded funds.',
    licences: [{ reg: 'DFSA', number: 'F00EX02', type: 'Category 3A' }, { reg: 'SCA', number: 'CP-EX0002', type: 'Trading broker' }, { reg: 'FCA', number: '900001', type: 'Investment firm' }],
    history: [
      { date: '2026-01-10', scores: [19, 12, 12, 9, 9], reason: 'First rating' },
      { date: '2026-05-04', scores: [22, 14, 13, 11, 10], reason: 'Re-review after new risk and compliance team' },
      { date: '2026-11-03', scores: [25, 16, 15, 12, 11], reason: 'Re-review after FCA licence and office opening in Riyadh' },
    ],
    reviews: [
      { name: 'Khalid M.', rating: 5, title: 'Professional service', body: 'My relationship manager explained margin requirements clearly before I started. Deposits are credited the same day.', months: 1, rel: 'client', verified: true, helpful: 6 },
      { name: 'Sophie T.', rating: 4, title: 'Wide product range', body: 'Good selection of US and GCC shares. Fees are clearly listed on the website.', months: 2, rel: 'client', verified: true },
      { name: 'Ahmed F.', rating: 3, title: 'Average app', body: 'The app works but crashed twice during volatile sessions.', months: 4, rel: 'client', reply: 'We released a new version of the app in October that fixes this issue. Please contact support if it happens again.' },
    ],
  },
  {
    name: 'Gulf FX DMCC', slug: 'gulf-fx-dmcc', category: 'Brokers', subs: ['FX & CFD brokers'], country: 'AE', website: 'https://example.net', minDeposit: 50, tier: 'standard',
    description: 'Gulf FX DMCC is a made-up onshore brokerage used in this demo, shown as licensed by the UAE Capital Market Authority to offer currency and contract-for-difference trading to retail clients.',
    licences: [{ reg: 'SCA', number: 'CP-EX0003', type: 'Trading broker' }],
    history: [{ date: '2026-09-02', scores: [22, 14, 13, 11, 11], reason: 'First rating' }],
    reviews: [{ name: 'Rania K.', rating: 4, title: 'Good local support', body: 'Office in Dubai and support answers quickly on the phone.', months: 2, rel: 'client' }],
  },
  {
    name: 'Desert Capital Markets Ltd', slug: 'desert-capital-markets-ltd', category: 'Brokers', subs: ['Securities and equities brokers'], country: 'AE', website: 'https://example.net', tier: 'standard',
    description: 'Desert Capital Markets Ltd is a made-up securities broker in ADGM used in this demo, shown as holding a Financial Services Permission from the FSRA for dealing in investments.',
    licences: [{ reg: 'FSRA', number: '990001', type: 'Financial Services Permission; Dealing in Investments as Agent' }],
    history: [{ date: '2026-08-14', scores: [20, 11, 11, 10, 10], reason: 'First rating' }],
  },
  {
    name: 'Alpha Markets (DIFC) Ltd', slug: 'alpha-markets-difc-ltd', category: 'Brokers', subs: ['Prime brokers and liquidity providers'], country: 'AE', website: 'https://example.net', tier: 'standard',
    description: 'Alpha Markets (DIFC) Ltd is a made-up prime broker used in this demo to show a listed company that BusinessLens has not rated yet. All factual data is still shown.',
    licences: [{ reg: 'DFSA', number: 'F00EX03', type: 'Category 2' }],
    reviews: [
      { name: 'J. Wong', rating: 3, title: 'Institutional only', body: 'Good execution but onboarding took two months.', months: 2, rel: 'partner' },
      { name: 'M. Haddad', rating: 4, title: 'Reliable liquidity', body: 'Stable pricing through the year for our desk.', months: 6, rel: 'partner' },
    ],
  },
  {
    name: 'Z Markets Online', slug: 'z-markets-online', category: 'Brokers', subs: ['FX & CFD brokers'], country: 'VG', website: 'https://example.net', tier: 'standard',
    description: 'Z Markets Online is a made-up offshore website used in this demo to show how a regulator warning appears. It is shown with no licence from any UAE regulator.',
    licences: [],
    alert: { title: 'Warning: Z Markets Online is not licensed in the UAE', reg: 'SCA', summary: 'The regulator warned the public that this website offers trading services in the UAE without a licence. (Made-up example for the demo.)' },
    reviews: [
      { name: 'Anonymous', rating: 1, title: 'Cannot withdraw', body: 'Asked to pay a "release fee" before any withdrawal. Stopped answering after that.', months: 1, rel: 'ex_client' },
      { name: 'S. Patel', rating: 2, title: 'Pressure to deposit', body: 'Daily calls asking me to deposit more.', months: 2, rel: 'ex_client' },
    ],
  },
  {
    name: 'Gate Village Bank Ltd', slug: 'gate-village-bank-ltd', category: 'Banks', subs: ['Investment banks'], country: 'AE', operating: ['AE', 'GB', 'SG'], website: 'https://example.com', founded: 2006, tier: 'standard',
    description: 'Gate Village Bank Ltd is a made-up bank in the DIFC used in this demo, shown as authorised by the DFSA under Category 1 to accept deposits and provide credit to professional clients.',
    licences: [{ reg: 'DFSA', number: 'F00EX04', type: 'Category 1: accepting deposits; providing credit' }],
    history: [{ date: '2026-07-01', scores: [27, 18, 17, 13, 12], reason: 'First rating' }, { date: '2026-10-20', scores: [28, 18, 17, 14, 13], reason: 'Annual re-review' }],
    reviews: [{ name: 'Corporate client', rating: 4, title: 'Strong trade finance team', body: 'Letters of credit handled quickly and accurately.', months: 3, rel: 'client', verified: true }],
  },
  {
    name: 'Oasis Digital Bank PJSC', slug: 'oasis-digital-bank-pjsc', category: 'Banks', subs: ['Digital and neo banks'], country: 'AE', website: 'https://example.com', founded: 2021, tier: 'standard',
    description: 'Oasis Digital Bank PJSC is a made-up digital bank used in this demo, shown as licensed by the Central Bank of the UAE to offer current and savings accounts and cards through a mobile app.',
    licences: [{ reg: 'CBUAE', number: 'BNK-EX-05', type: 'Licensed bank' }],
    history: [{ date: '2026-09-18', scores: [26, 16, 16, 12, 11], reason: 'First rating' }],
    reviews: [
      { name: 'Hana B.', rating: 5, title: 'Account in 10 minutes', body: 'Opened with Emirates ID only. Card arrived in three days.', months: 1, rel: 'client', verified: true, helpful: 3 },
      { name: 'Tom E.', rating: 3, title: 'Limits too low', body: 'Daily transfer limit is low for business use.', months: 2, rel: 'client' },
    ],
  },
  {
    name: 'Falcon Custody Services Ltd', slug: 'falcon-custody-services-ltd', category: 'Custody & trust', subs: ['Custodians'], country: 'AE', website: 'https://example.com', tier: 'standard',
    description: 'Falcon Custody Services Ltd is a made-up custodian in ADGM used in this demo to show the "Under review" state: the previous score stays visible while analysts re-rate the firm.',
    licences: [{ reg: 'FSRA', number: '990002', type: 'Financial Services Permission; Providing Custody' }],
    history: [{ date: '2026-03-11', scores: [26, 17, 16, 13, 12], reason: 'First rating' }],
    finalState: 'under_review', stateNote: 'Our analysts are re-reviewing this company after a change of ownership.',
  },
  {
    name: 'Sand Dune Crypto Exchange FZE', slug: 'sand-dune-crypto-exchange-fze', category: 'Crypto & digital assets', subs: ['Crypto exchanges'], country: 'AE', website: 'https://example.com', founded: 2023, tier: 'standard',
    description: 'Sand Dune Crypto Exchange FZE is a made-up virtual asset exchange used in this demo, shown as licensed by VARA in Dubai for exchange services.',
    licences: [{ reg: 'VARA', number: 'VL/EX/0001', type: 'Exchange Services' }],
    history: [{ date: '2026-10-01', scores: [17, 10, 9, 8, 8], reason: 'First rating' }],
    reviews: [{ name: 'Ali R.', rating: 3, title: 'Few coins', body: 'Works well but only a small number of assets are listed.', months: 1, rel: 'client' }],
  },
  {
    name: 'Harbor Insurance Brokers LLC', slug: 'harbor-insurance-brokers-llc', category: 'Insurance', subs: ['Insurance brokers'], country: 'AE', website: 'https://example.com', tier: 'standard',
    description: 'Harbor Insurance Brokers LLC is a made-up insurance broker used in this demo to show the "Rating suspended" state.',
    licences: [{ reg: 'CBUAE', number: 'INS-EX-07', type: 'Insurance broker', status: 'Suspended' }],
    history: [{ date: '2026-04-22', scores: [22, 14, 13, 11, 10], reason: 'First rating' }],
    finalState: 'suspended', stateNote: 'Rating paused while the licence status is confirmed with the regulator.',
  },
  {
    name: 'Riyadh Example Capital', slug: 'riyadh-example-capital', category: 'Asset & wealth management', subs: ['Asset managers'], country: 'SA', website: 'https://example.com', founded: 2009, tier: 'standard',
    description: 'Riyadh Example Capital is a made-up asset manager in Saudi Arabia used in this demo, shown as authorised by the Capital Market Authority for managing investments and arranging.',
    licences: [{ reg: 'CMA-KSA', number: '0000-EX', type: 'Managing investments; Arranging' }],
    history: [{ date: '2026-08-30', scores: [22, 14, 14, 10, 10], reason: 'First rating' }],
  },
]

export const PARTNER_EXTRA = {
  logoUrl: '/demo/partner-logo.svg',
  bannerUrl: '/demo/partner-banner.svg',
  ctaLabel: 'Open an account',
  ctaUrl: 'https://example.org',
  extendedAbout:
    'Partner Brokerage LLC is a made-up company used to show what a Partner profile looks like. Partners get more space, branding and tools. Their BusinessLens Rating, licences and reviews are shown exactly as on every other profile.\n\nThe company serves retail and professional clients from offices in Dubai, Riyadh and London, with support in English, Arabic and French.',
  accounts: 'Standard account: from USD 100, spreads from 1.0 pip.\nPro account: from USD 5,000, raw spreads plus commission.\nIslamic (swap-free) accounts available on request.',
  instruments: '60+ currency pairs; 20 indices; 1,500 US, UK and GCC shares; ETFs; gold and oil.',
  platformsDetail: 'MetaTrader 5 (desktop, web, mobile); cTrader; PB Trade app for iOS and Android.',
  fees: 'No deposit fees. One free withdrawal per month, then USD 5. Inactivity fee: none.',
  team: [
    { name: 'Sara Example', role: 'Chief Executive Officer', bio: 'Made-up person for the demo. 20 years in brokerage in Dubai and London.' },
    { name: 'Youssef Example', role: 'Chief Financial Officer', bio: 'Made-up person for the demo. Formerly finance director at a regional bank.' },
    { name: 'Anna Example', role: 'Head of Compliance', bio: 'Made-up person for the demo. Leads compliance across the three licences.' },
  ],
  offices: [
    { city: 'Dubai', country: 'AE', address: 'DIFC, Dubai', lat: 25.2116, lng: 55.2824 },
    { city: 'Riyadh', country: 'SA', address: 'King Abdullah Financial District', lat: 24.7605, lng: 46.6408 },
    { city: 'London', country: 'GB', address: 'City of London', lat: 51.5136, lng: -0.0889 },
  ],
  news: [
    { title: 'New office in Riyadh', date: '2026-09-15', summary: 'Made-up announcement: the company opened an office in King Abdullah Financial District.' },
    { title: 'App version 4.0 released', date: '2026-10-02', summary: 'Made-up announcement: faster charts and price alerts.' },
  ],
  documents: [
    { title: 'Client agreement (PDF)', url: 'https://example.org' },
    { title: 'Order execution policy (PDF)', url: 'https://example.org' },
  ],
}
