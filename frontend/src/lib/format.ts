/**
 * Currency formatting. Prices are stored in major units (rupees) as imported
 * from the product CSV (e.g. 835 = ₹835).
 */
const SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatPrice(amount: number, currency = 'INR'): string {
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
