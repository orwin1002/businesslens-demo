import { rich } from './richtext'

const placeholder = (what: string) =>
  rich([
    `Placeholder text. The final ${what} will be supplied by BusinessLens and published here before launch.`,
    'This demo shows where the page lives, how it is linked from every profile and the footer, and that editors can change it from the admin panel without a developer.',
  ])

export const PAGES = [
  { slug: 'about', title: 'About BusinessLens', body: rich([
    'BusinessLens helps people understand who they are dealing with in financial services. Any visitor can search a company and see what it is, where it is licensed, how BusinessLens rates it and what other users say about it.',
    { h2: 'What makes us different' },
    { list: [
      'Every type of financial institution in one directory: brokers, banks, custodians, funds, payment firms, crypto firms, insurers and more.',
      'An expert rating out of 10 from our analysts, shown separately from the community score.',
      'Licences shown with the regulator, licence number, status and a link to the official register.',
      'Middle East first: UAE and GCC regulators are first-class citizens in search and browsing.',
    ] },
  ]) },
  { slug: 'independence', title: 'Independence statement', body: rich([
    'BusinessLens is not owned by or affiliated with any company or regulator it rates.',
    'Ratings are assigned only by BusinessLens analysts against a published methodology. Companies cannot edit their own score, and a subscription has no technical link to any score. Partners improve their rating only by being re-reviewed after real improvements.',
    'Paid placements are always labelled "Featured" or "Partner" and never change the order of normal results.',
  ]) },
  { slug: 'review-guidelines', title: 'Review guidelines', body: rich([
    'Reviews must describe your own experience with the company within the last few years. One review per company every 12 months.',
    { list: ['Be factual and specific.', 'No personal data, insults or links.', 'Do not post on behalf of a company or a competitor.', 'Every review is checked by a moderator before it is published.'] },
  ]) },
  { slug: 'complaints', title: 'Complaints and right of reply', body: rich([
    'Every profile links to "Request a rating review" and "Report an error". Companies that claim their profile can reply publicly to reviews.',
    'Our team answers every request. Placeholder: final complaints procedure to be supplied by BusinessLens.',
  ]) },
  { slug: 'terms', title: 'Terms of use', body: placeholder('terms of use') },
  { slug: 'privacy', title: 'Privacy notice', body: placeholder('privacy notice (UAE PDPL and GDPR)') },
  { slug: 'cookies', title: 'Cookie policy', body: placeholder('cookie policy') },
  { slug: 'disclaimer', title: 'Disclaimer', body: rich([
    'Information only. Not investment advice. Not an endorsement.',
    'BusinessLens collects licence information from official public registers and shows the source and the date it was last checked. Always confirm a firm\'s status on the regulator\'s own register before dealing with it.',
  ]) },
]

export const INSIGHTS = [
  {
    slug: 'how-to-check-a-broker-licence-in-the-uae',
    title: 'How to check a broker\'s licence in the UAE',
    excerpt: 'Five regulators license financial firms in the UAE. Here is how to tell which one should supervise a firm, and where to confirm it.',
    body: rich([
      'A firm offering investment services to people in the UAE should hold a licence from the regulator that covers where it operates. The UAE has several financial regulators, and each publishes a public register.',
      { h2: 'Which regulator?' },
      { list: [
        'DFSA: firms in the Dubai International Financial Centre (DIFC).',
        'FSRA: firms in Abu Dhabi Global Market (ADGM).',
        'Capital Market Authority (formerly SCA): securities and commodities firms onshore.',
        'Central Bank of the UAE: banks, finance companies, exchange houses, payment firms and insurers.',
        'VARA: virtual asset firms in Dubai outside the DIFC.',
      ] },
      { h2: 'What to check' },
      'Search the register for the firm\'s exact legal name, not its brand. Confirm that the licence is active and that the permitted activities match what the firm is offering you. Every BusinessLens profile links to the official register record so you can check this yourself.',
    ]),
  },
  {
    slug: 'what-the-businesslens-rating-measures',
    title: 'What the BusinessLens Rating measures',
    excerpt: 'Our analysts score five criteria. Here is what each one means and why the community score is kept separate.',
    body: rich([
      'Every rated company carries a BusinessLens Rating out of 10. It is built from five criteria: regulatory and compliance, company and founders, team strength, operational set-up and public record.',
      'User reviews are shown separately as a Community Score from 1 to 5 stars. The two numbers are never combined, because they answer different questions: one is an expert assessment against a published method, the other is the experience of individual clients.',
    ]),
  },
  {
    slug: 'understanding-regulator-warnings',
    title: 'Understanding regulator warnings',
    excerpt: 'Regulators publish lists of firms that are not authorised. What a warning means, and what it does not.',
    body: rich([
      'Regulators publish warnings about firms that claim to be licensed but are not, or that use the name of a licensed firm without permission. A warning is a strong signal to stop and check before sending money.',
      'BusinessLens shows a red banner on any profile linked to an official warning, with a link to the regulator\'s own notice. The banner overrides everything else on the page.',
    ]),
  },
]

export const HOME = {
  popularSearches: [
    { label: 'FX brokers UAE', href: '/category/fx-and-cfd-brokers/ae' },
    { label: 'Digital banks', href: '/category/digital-and-neo-banks' },
    { label: 'VARA licensed', href: '/regulator/vara' },
    { label: 'Custodians', href: '/category/custodians' },
    { label: 'DIFC firms', href: '/regulator/dfsa' },
  ],
}
