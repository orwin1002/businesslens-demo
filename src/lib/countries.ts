// ISO-3166 alpha-2 names for the countries that appear in the directory.
export const COUNTRIES: Record<string, string> = {
  AE: 'United Arab Emirates', SA: 'Saudi Arabia', QA: 'Qatar', BH: 'Bahrain', KW: 'Kuwait', OM: 'Oman',
  GB: 'United Kingdom', US: 'United States', CY: 'Cyprus', SG: 'Singapore', IN: 'India', HK: 'Hong Kong',
  CH: 'Switzerland', DE: 'Germany', FR: 'France', NL: 'Netherlands', LU: 'Luxembourg', IE: 'Ireland',
  JP: 'Japan', CN: 'China', AU: 'Australia', CA: 'Canada', EG: 'Egypt', JO: 'Jordan', LB: 'Lebanon',
  PK: 'Pakistan', TR: 'Turkey', ZA: 'South Africa', MU: 'Mauritius', MT: 'Malta', IT: 'Italy', ES: 'Spain',
  BE: 'Belgium', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', AT: 'Austria', KR: 'South Korea',
  MY: 'Malaysia', ID: 'Indonesia', TH: 'Thailand', PH: 'Philippines', NG: 'Nigeria', KE: 'Kenya', MA: 'Morocco',
  BM: 'Bermuda', KY: 'Cayman Islands', VG: 'British Virgin Islands', JE: 'Jersey', GG: 'Guernsey', IM: 'Isle of Man',
  GI: 'Gibraltar', LI: 'Liechtenstein', MC: 'Monaco', BS: 'Bahamas', SC: 'Seychelles', VU: 'Vanuatu', BR: 'Brazil',
  MX: 'Mexico', IL: 'Israel', IR: 'Iran', IQ: 'Iraq', GR: 'Greece', PT: 'Portugal', PL: 'Poland', CZ: 'Czechia',
  RU: 'Russia', UA: 'Ukraine', NZ: 'New Zealand', TW: 'Taiwan', VN: 'Vietnam', BD: 'Bangladesh', LK: 'Sri Lanka',
}
export const GCC = ['AE', 'SA', 'QA', 'BH', 'KW', 'OM']

export const countryName = (code?: string | null) => (code ? COUNTRIES[code.toUpperCase()] ?? code.toUpperCase() : '')
