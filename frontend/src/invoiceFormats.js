export const INVOICE_FORMATS = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean white tax invoice with simple header',
    accent: '#0f766e',
  },
  {
    id: 'teal-banner',
    name: 'Teal Banner',
    description: 'Bold teal header band with logo and title',
    accent: '#0d9488',
  },
  {
    id: 'formal',
    name: 'Formal GST',
    description: 'Double-border traditional GST invoice look',
    accent: '#1e3a5f',
  },
  {
    id: 'slate',
    name: 'Slate Header',
    description: 'Dark slate masthead with light body',
    accent: '#334155',
  },
  {
    id: 'boxed',
    name: 'Boxed Parties',
    description: 'Seller and buyer in bordered information cards',
    accent: '#0f766e',
  },
  {
    id: 'emerald',
    name: 'Emerald Edge',
    description: 'Left accent edge with soft mint highlights',
    accent: '#047857',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense layout for more line items on one page',
    accent: '#475569',
  },
  {
    id: 'navy-ribbon',
    name: 'Navy Ribbon',
    description: 'Navy title ribbon and strong totals strip',
    accent: '#1e3a8a',
  },
  {
    id: 'split',
    name: 'Split Layout',
    description: 'Two-column masthead with invoice meta on the right',
    accent: '#0e7490',
  },
  {
    id: 'stamp',
    name: 'Office Stamp',
    description: 'Centered title with stamp-style tax type badge',
    accent: '#9a3412',
  },
];

export const DEFAULT_FORMAT_ID = 'classic';

export function isValidFormatId(id) {
  return INVOICE_FORMATS.some((f) => f.id === id);
}

export function getFormat(id) {
  return INVOICE_FORMATS.find((f) => f.id === id) || INVOICE_FORMATS[0];
}
