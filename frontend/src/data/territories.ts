export interface Territory {
  code: string
  name: string
  continent: string
}

export interface Continent {
  id: string
  name: string
  countries: Territory[]
}

export const continents: Continent[] = [
  {
    id: 'africa',
    name: 'Africa',
    countries: [
      { code: 'DZ', name: 'Algeria', continent: 'africa' },
      { code: 'AO', name: 'Angola', continent: 'africa' },
      { code: 'BJ', name: 'Benin', continent: 'africa' },
      { code: 'BW', name: 'Botswana', continent: 'africa' },
      { code: 'BF', name: 'Burkina Faso', continent: 'africa' },
      { code: 'BI', name: 'Burundi', continent: 'africa' },
      { code: 'CM', name: 'Cameroon', continent: 'africa' },
      { code: 'CV', name: 'Cape Verde', continent: 'africa' },
      { code: 'CF', name: 'Central African Republic', continent: 'africa' },
      { code: 'TD', name: 'Chad', continent: 'africa' },
      { code: 'KM', name: 'Comoros', continent: 'africa' },
      { code: 'CG', name: 'Congo', continent: 'africa' },
      { code: 'CD', name: 'Congo, Democratic Republic', continent: 'africa' },
      { code: 'CI', name: 'Côte d\'Ivoire', continent: 'africa' },
      { code: 'DJ', name: 'Djibouti', continent: 'africa' },
      { code: 'EG', name: 'Egypt', continent: 'africa' },
      { code: 'GQ', name: 'Equatorial Guinea', continent: 'africa' },
      { code: 'ER', name: 'Eritrea', continent: 'africa' },
      { code: 'SZ', name: 'Eswatini', continent: 'africa' },
      { code: 'ET', name: 'Ethiopia', continent: 'africa' },
      { code: 'GA', name: 'Gabon', continent: 'africa' },
      { code: 'GM', name: 'Gambia', continent: 'africa' },
      { code: 'GH', name: 'Ghana', continent: 'africa' },
      { code: 'GN', name: 'Guinea', continent: 'africa' },
      { code: 'GW', name: 'Guinea-Bissau', continent: 'africa' },
      { code: 'KE', name: 'Kenya', continent: 'africa' },
      { code: 'LS', name: 'Lesotho', continent: 'africa' },
      { code: 'LR', name: 'Liberia', continent: 'africa' },
      { code: 'LY', name: 'Libya', continent: 'africa' },
      { code: 'MG', name: 'Madagascar', continent: 'africa' },
      { code: 'MW', name: 'Malawi', continent: 'africa' },
      { code: 'ML', name: 'Mali', continent: 'africa' },
      { code: 'MR', name: 'Mauritania', continent: 'africa' },
      { code: 'MU', name: 'Mauritius', continent: 'africa' },
      { code: 'MA', name: 'Morocco', continent: 'africa' },
      { code: 'MZ', name: 'Mozambique', continent: 'africa' },
      { code: 'NA', name: 'Namibia', continent: 'africa' },
      { code: 'NE', name: 'Niger', continent: 'africa' },
      { code: 'NG', name: 'Nigeria', continent: 'africa' },
      { code: 'RW', name: 'Rwanda', continent: 'africa' },
      { code: 'ST', name: 'São Tomé and Príncipe', continent: 'africa' },
      { code: 'SN', name: 'Senegal', continent: 'africa' },
      { code: 'SC', name: 'Seychelles', continent: 'africa' },
      { code: 'SL', name: 'Sierra Leone', continent: 'africa' },
      { code: 'SO', name: 'Somalia', continent: 'africa' },
      { code: 'ZA', name: 'South Africa', continent: 'africa' },
      { code: 'SS', name: 'South Sudan', continent: 'africa' },
      { code: 'SD', name: 'Sudan', continent: 'africa' },
      { code: 'TZ', name: 'Tanzania', continent: 'africa' },
      { code: 'TG', name: 'Togo', continent: 'africa' },
      { code: 'TN', name: 'Tunisia', continent: 'africa' },
      { code: 'UG', name: 'Uganda', continent: 'africa' },
      { code: 'ZM', name: 'Zambia', continent: 'africa' },
      { code: 'ZW', name: 'Zimbabwe', continent: 'africa' }
    ]
  },
  {
    id: 'americas',
    name: 'Americas',
    countries: [
      { code: 'AR', name: 'Argentina', continent: 'americas' },
      { code: 'BS', name: 'Bahamas', continent: 'americas' },
      { code: 'BB', name: 'Barbados', continent: 'americas' },
      { code: 'BZ', name: 'Belize', continent: 'americas' },
      { code: 'BO', name: 'Bolivia', continent: 'americas' },
      { code: 'BR', name: 'Brazil', continent: 'americas' },
      { code: 'CA', name: 'Canada', continent: 'americas' },
      { code: 'CL', name: 'Chile', continent: 'americas' },
      { code: 'CO', name: 'Colombia', continent: 'americas' },
      { code: 'CR', name: 'Costa Rica', continent: 'americas' },
      { code: 'CU', name: 'Cuba', continent: 'americas' },
      { code: 'DM', name: 'Dominica', continent: 'americas' },
      { code: 'DO', name: 'Dominican Republic', continent: 'americas' },
      { code: 'EC', name: 'Ecuador', continent: 'americas' },
      { code: 'SV', name: 'El Salvador', continent: 'americas' },
      { code: 'GD', name: 'Grenada', continent: 'americas' },
      { code: 'GT', name: 'Guatemala', continent: 'americas' },
      { code: 'GY', name: 'Guyana', continent: 'americas' },
      { code: 'HT', name: 'Haiti', continent: 'americas' },
      { code: 'HN', name: 'Honduras', continent: 'americas' },
      { code: 'JM', name: 'Jamaica', continent: 'americas' },
      { code: 'MX', name: 'Mexico', continent: 'americas' },
      { code: 'NI', name: 'Nicaragua', continent: 'americas' },
      { code: 'PA', name: 'Panama', continent: 'americas' },
      { code: 'PY', name: 'Paraguay', continent: 'americas' },
      { code: 'PE', name: 'Peru', continent: 'americas' },
      { code: 'KN', name: 'Saint Kitts and Nevis', continent: 'americas' },
      { code: 'LC', name: 'Saint Lucia', continent: 'americas' },
      { code: 'VC', name: 'Saint Vincent and the Grenadines', continent: 'americas' },
      { code: 'SR', name: 'Suriname', continent: 'americas' },
      { code: 'TT', name: 'Trinidad and Tobago', continent: 'americas' },
      { code: 'US', name: 'United States', continent: 'americas' },
      { code: 'UY', name: 'Uruguay', continent: 'americas' },
      { code: 'VE', name: 'Venezuela', continent: 'americas' }
    ]
  },
  {
    id: 'asia',
    name: 'Asia',
    countries: [
      { code: 'AF', name: 'Afghanistan', continent: 'asia' },
      { code: 'AM', name: 'Armenia', continent: 'asia' },
      { code: 'AZ', name: 'Azerbaijan', continent: 'asia' },
      { code: 'BH', name: 'Bahrain', continent: 'asia' },
      { code: 'BD', name: 'Bangladesh', continent: 'asia' },
      { code: 'BT', name: 'Bhutan', continent: 'asia' },
      { code: 'BN', name: 'Brunei', continent: 'asia' },
      { code: 'KH', name: 'Cambodia', continent: 'asia' },
      { code: 'CN', name: 'China', continent: 'asia' },
      { code: 'CY', name: 'Cyprus', continent: 'asia' },
      { code: 'GE', name: 'Georgia', continent: 'asia' },
      { code: 'IN', name: 'India', continent: 'asia' },
      { code: 'ID', name: 'Indonesia', continent: 'asia' },
      { code: 'IR', name: 'Iran', continent: 'asia' },
      { code: 'IQ', name: 'Iraq', continent: 'asia' },
      { code: 'IL', name: 'Israel', continent: 'asia' },
      { code: 'JP', name: 'Japan', continent: 'asia' },
      { code: 'JO', name: 'Jordan', continent: 'asia' },
      { code: 'KZ', name: 'Kazakhstan', continent: 'asia' },
      { code: 'KW', name: 'Kuwait', continent: 'asia' },
      { code: 'KG', name: 'Kyrgyzstan', continent: 'asia' },
      { code: 'LA', name: 'Laos', continent: 'asia' },
      { code: 'LB', name: 'Lebanon', continent: 'asia' },
      { code: 'MY', name: 'Malaysia', continent: 'asia' },
      { code: 'MV', name: 'Maldives', continent: 'asia' },
      { code: 'MN', name: 'Mongolia', continent: 'asia' },
      { code: 'MM', name: 'Myanmar', continent: 'asia' },
      { code: 'NP', name: 'Nepal', continent: 'asia' },
      { code: 'KP', name: 'North Korea', continent: 'asia' },
      { code: 'OM', name: 'Oman', continent: 'asia' },
      { code: 'PK', name: 'Pakistan', continent: 'asia' },
      { code: 'PS', name: 'Palestine', continent: 'asia' },
      { code: 'PH', name: 'Philippines', continent: 'asia' },
      { code: 'QA', name: 'Qatar', continent: 'asia' },
      { code: 'SA', name: 'Saudi Arabia', continent: 'asia' },
      { code: 'SG', name: 'Singapore', continent: 'asia' },
      { code: 'KR', name: 'South Korea', continent: 'asia' },
      { code: 'LK', name: 'Sri Lanka', continent: 'asia' },
      { code: 'SY', name: 'Syria', continent: 'asia' },
      { code: 'TW', name: 'Taiwan', continent: 'asia' },
      { code: 'TJ', name: 'Tajikistan', continent: 'asia' },
      { code: 'TH', name: 'Thailand', continent: 'asia' },
      { code: 'TL', name: 'Timor-Leste', continent: 'asia' },
      { code: 'TR', name: 'Turkey', continent: 'asia' },
      { code: 'TM', name: 'Turkmenistan', continent: 'asia' },
      { code: 'AE', name: 'United Arab Emirates', continent: 'asia' },
      { code: 'UZ', name: 'Uzbekistan', continent: 'asia' },
      { code: 'VN', name: 'Vietnam', continent: 'asia' },
      { code: 'YE', name: 'Yemen', continent: 'asia' }
    ]
  },
  {
    id: 'europe',
    name: 'Europe',
    countries: [
      { code: 'AL', name: 'Albania', continent: 'europe' },
      { code: 'AD', name: 'Andorra', continent: 'europe' },
      { code: 'AT', name: 'Austria', continent: 'europe' },
      { code: 'BY', name: 'Belarus', continent: 'europe' },
      { code: 'BE', name: 'Belgium', continent: 'europe' },
      { code: 'BA', name: 'Bosnia and Herzegovina', continent: 'europe' },
      { code: 'BG', name: 'Bulgaria', continent: 'europe' },
      { code: 'HR', name: 'Croatia', continent: 'europe' },
      { code: 'CZ', name: 'Czech Republic', continent: 'europe' },
      { code: 'DK', name: 'Denmark', continent: 'europe' },
      { code: 'EE', name: 'Estonia', continent: 'europe' },
      { code: 'FI', name: 'Finland', continent: 'europe' },
      { code: 'FR', name: 'France', continent: 'europe' },
      { code: 'DE', name: 'Germany', continent: 'europe' },
      { code: 'GR', name: 'Greece', continent: 'europe' },
      { code: 'HU', name: 'Hungary', continent: 'europe' },
      { code: 'IS', name: 'Iceland', continent: 'europe' },
      { code: 'IE', name: 'Ireland', continent: 'europe' },
      { code: 'IT', name: 'Italy', continent: 'europe' },
      { code: 'XK', name: 'Kosovo', continent: 'europe' },
      { code: 'LV', name: 'Latvia', continent: 'europe' },
      { code: 'LI', name: 'Liechtenstein', continent: 'europe' },
      { code: 'LT', name: 'Lithuania', continent: 'europe' },
      { code: 'LU', name: 'Luxembourg', continent: 'europe' },
      { code: 'MT', name: 'Malta', continent: 'europe' },
      { code: 'MD', name: 'Moldova', continent: 'europe' },
      { code: 'MC', name: 'Monaco', continent: 'europe' },
      { code: 'ME', name: 'Montenegro', continent: 'europe' },
      { code: 'NL', name: 'Netherlands', continent: 'europe' },
      { code: 'MK', name: 'North Macedonia', continent: 'europe' },
      { code: 'NO', name: 'Norway', continent: 'europe' },
      { code: 'PL', name: 'Poland', continent: 'europe' },
      { code: 'PT', name: 'Portugal', continent: 'europe' },
      { code: 'RO', name: 'Romania', continent: 'europe' },
      { code: 'RU', name: 'Russia', continent: 'europe' },
      { code: 'SM', name: 'San Marino', continent: 'europe' },
      { code: 'RS', name: 'Serbia', continent: 'europe' },
      { code: 'SK', name: 'Slovakia', continent: 'europe' },
      { code: 'SI', name: 'Slovenia', continent: 'europe' },
      { code: 'ES', name: 'Spain', continent: 'europe' },
      { code: 'SE', name: 'Sweden', continent: 'europe' },
      { code: 'CH', name: 'Switzerland', continent: 'europe' },
      { code: 'UA', name: 'Ukraine', continent: 'europe' },
      { code: 'GB', name: 'United Kingdom', continent: 'europe' },
      { code: 'VA', name: 'Vatican City', continent: 'europe' }
    ]
  },
  {
    id: 'oceania',
    name: 'Oceania',
    countries: [
      { code: 'AU', name: 'Australia', continent: 'oceania' },
      { code: 'FJ', name: 'Fiji', continent: 'oceania' },
      { code: 'KI', name: 'Kiribati', continent: 'oceania' },
      { code: 'MH', name: 'Marshall Islands', continent: 'oceania' },
      { code: 'FM', name: 'Micronesia', continent: 'oceania' },
      { code: 'NR', name: 'Nauru', continent: 'oceania' },
      { code: 'NZ', name: 'New Zealand', continent: 'oceania' },
      { code: 'PW', name: 'Palau', continent: 'oceania' },
      { code: 'PG', name: 'Papua New Guinea', continent: 'oceania' },
      { code: 'WS', name: 'Samoa', continent: 'oceania' },
      { code: 'SB', name: 'Solomon Islands', continent: 'oceania' },
      { code: 'TO', name: 'Tonga', continent: 'oceania' },
      { code: 'TV', name: 'Tuvalu', continent: 'oceania' },
      { code: 'VU', name: 'Vanuatu', continent: 'oceania' }
    ]
  }
];

// Get all countries as a flat array
export const allCountries: Territory[] = continents.flatMap(continent => continent.countries);

// DSP-specific exclusions
export const dspExclusions = {
  spotify: ['SY', 'IR', 'CU', 'KP'], // Syria, Iran, Cuba, North Korea
  appleMusic: ['SY', 'IR', 'CU', 'KP', 'SD'], // Syria, Iran, Cuba, North Korea, Sudan
  youtubeMusic: ['SY', 'IR', 'CU', 'KP'],
  tiktok: ['IN'] // India has banned TikTok
};

// Helper functions
export function getCountryByCode(code: string): Territory | undefined {
  return allCountries.find(country => country.code === code);
}

export function getCountriesByContinent(continentId: string): Territory[] {
  const continent = continents.find(c => c.id === continentId);
  return continent ? continent.countries : [];
}

export function getExcludedCountriesForDSPs(selectedDSPs: string[]): string[] {
  const excludedCodes = new Set<string>();

  selectedDSPs.forEach(dsp => {
    const exclusions = dspExclusions[dsp as keyof typeof dspExclusions];
    if (exclusions) {
      exclusions.forEach(code => excludedCodes.add(code));
    }
  });

  return Array.from(excludedCodes);
}
