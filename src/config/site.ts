export const SITE = {
  url: 'https://essencewaxstudio.com',
  name: 'Essence Wax Studio',
  domain: 'EssenceWaxStudio.com',
  seller: 'Desert Rich',
  email: 'sales@desertrich.com',
  price: '50000',
  priceDisplay: '$50,000',
  priceCurrency: 'USD',
  priceValidUntil: '2027-12-31',
  googleSiteVerification: 'J3dZuEKL7nnd-79cFj1ti6WePjUwCEENyjDNpjBZxUk',
  ogImage:
    'https://customer-wa9cpywo3l4jte5c.cloudflarestream.com/b687f8087e0bcbe2695074f2d88dec95/thumbnails/thumbnail.jpg?time=&height=600',
  ogImageAlt: 'Essence Wax Studio — premium wax studio domain for sale',
  escrow: 'https://www.escrow.com',
  streamId: 'b687f8087e0bcbe2695074f2d88dec95',
  streamHost: 'customer-wa9cpywo3l4jte5c.cloudflarestream.com',
} as const;

export const ACQUISITION_MAILTO = (subject?: string, body?: string) => {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body ?? '');
  const qs = params.toString();
  return `mailto:${SITE.email}${qs ? `?${params.toString()}` : ''}`;
};
