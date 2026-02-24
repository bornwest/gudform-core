/**
 * Supported currencies for form payment collection.
 *
 * Each entry matches a Stripe-supported currency code.
 * `symbol` is the display symbol; `minAmount` is the minimum
 * charge in the currency's smallest unit (cents/pence/etc.).
 * `zeroDecimal` indicates currencies with no decimal sub-unit.
 */

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  minAmount: number; // minimum in smallest unit (e.g. 50 = $0.50 for USD)
  zeroDecimal: boolean;
}

export const CURRENCIES: CurrencyConfig[] = [
  // Major currencies
  { code: "usd", name: "US Dollar", symbol: "$", minAmount: 50, zeroDecimal: false },
  { code: "eur", name: "Euro", symbol: "€", minAmount: 50, zeroDecimal: false },
  { code: "gbp", name: "British Pound", symbol: "£", minAmount: 30, zeroDecimal: false },
  { code: "cad", name: "Canadian Dollar", symbol: "CA$", minAmount: 50, zeroDecimal: false },
  { code: "aud", name: "Australian Dollar", symbol: "A$", minAmount: 50, zeroDecimal: false },
  { code: "nzd", name: "New Zealand Dollar", symbol: "NZ$", minAmount: 50, zeroDecimal: false },
  // European
  { code: "chf", name: "Swiss Franc", symbol: "CHF", minAmount: 50, zeroDecimal: false },
  { code: "sek", name: "Swedish Krona", symbol: "kr", minAmount: 300, zeroDecimal: false },
  { code: "nok", name: "Norwegian Krone", symbol: "kr", minAmount: 300, zeroDecimal: false },
  { code: "dkk", name: "Danish Krone", symbol: "kr", minAmount: 250, zeroDecimal: false },
  { code: "pln", name: "Polish Zloty", symbol: "zł", minAmount: 200, zeroDecimal: false },
  { code: "czk", name: "Czech Koruna", symbol: "Kč", minAmount: 1500, zeroDecimal: false },
  { code: "ron", name: "Romanian Leu", symbol: "lei", minAmount: 200, zeroDecimal: false },
  { code: "huf", name: "Hungarian Forint", symbol: "Ft", minAmount: 17500, zeroDecimal: false },
  { code: "bgn", name: "Bulgarian Lev", symbol: "лв", minAmount: 100, zeroDecimal: false },
  // Asia-Pacific
  { code: "jpy", name: "Japanese Yen", symbol: "¥", minAmount: 50, zeroDecimal: true },
  { code: "sgd", name: "Singapore Dollar", symbol: "S$", minAmount: 50, zeroDecimal: false },
  { code: "hkd", name: "Hong Kong Dollar", symbol: "HK$", minAmount: 400, zeroDecimal: false },
  { code: "inr", name: "Indian Rupee", symbol: "₹", minAmount: 50, zeroDecimal: false },
  { code: "myr", name: "Malaysian Ringgit", symbol: "RM", minAmount: 200, zeroDecimal: false },
  { code: "thb", name: "Thai Baht", symbol: "฿", minAmount: 1000, zeroDecimal: false },
  { code: "php", name: "Philippine Peso", symbol: "₱", minAmount: 10000, zeroDecimal: false },
  { code: "idr", name: "Indonesian Rupiah", symbol: "Rp", minAmount: 1000, zeroDecimal: false },
  // Americas
  { code: "brl", name: "Brazilian Real", symbol: "R$", minAmount: 50, zeroDecimal: false },
  { code: "mxn", name: "Mexican Peso", symbol: "MX$", minAmount: 1000, zeroDecimal: false },
  { code: "ars", name: "Argentine Peso", symbol: "ARS", minAmount: 50, zeroDecimal: false },
  { code: "clp", name: "Chilean Peso", symbol: "CLP", minAmount: 1, zeroDecimal: true },
  { code: "cop", name: "Colombian Peso", symbol: "COP", minAmount: 1, zeroDecimal: false },
  // Africa & Middle East
  { code: "zar", name: "South African Rand", symbol: "R", minAmount: 500, zeroDecimal: false },
  { code: "aed", name: "UAE Dirham", symbol: "د.إ", minAmount: 200, zeroDecimal: false },
  { code: "sar", name: "Saudi Riyal", symbol: "﷼", minAmount: 200, zeroDecimal: false },
  { code: "ils", name: "Israeli Shekel", symbol: "₪", minAmount: 100, zeroDecimal: false },
  { code: "ngn", name: "Nigerian Naira", symbol: "₦", minAmount: 50, zeroDecimal: false },
  { code: "kes", name: "Kenyan Shilling", symbol: "KSh", minAmount: 50, zeroDecimal: false },
];

/**
 * Lookup a currency config by its code. Falls back to USD if not found.
 */
export function getCurrency(code: string): CurrencyConfig {
  return (
    CURRENCIES.find((c) => c.code === code.toLowerCase()) ??
    CURRENCIES[0] // USD fallback
  );
}

/**
 * Format an amount (in smallest unit) for display.
 * e.g. formatAmount(1099, "usd") → "$10.99"
 *      formatAmount(1500, "jpy") → "¥1,500"
 */
export function formatPaymentAmount(
  amount: number,
  currencyCode: string,
): string {
  const currency = getCurrency(currencyCode);
  if (currency.zeroDecimal) {
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
  return `${currency.symbol}${(amount / 100).toFixed(2)}`;
}

/**
 * Convert a display value (e.g. "10.99") to the smallest unit for storage.
 * For zero-decimal currencies, returns the value as-is.
 */
export function toSmallestUnit(
  displayValue: number,
  currencyCode: string,
): number {
  const currency = getCurrency(currencyCode);
  if (currency.zeroDecimal) {
    return Math.round(displayValue);
  }
  return Math.round(displayValue * 100);
}

/**
 * Convert a stored amount (smallest unit) to the display value.
 * e.g. fromSmallestUnit(1099, "usd") → 10.99
 *      fromSmallestUnit(1500, "jpy") → 1500
 */
export function fromSmallestUnit(
  amount: number,
  currencyCode: string,
): number {
  const currency = getCurrency(currencyCode);
  if (currency.zeroDecimal) {
    return amount;
  }
  return amount / 100;
}

/**
 * Get the minimum display amount for a currency.
 * e.g. getMinDisplayAmount("usd") → 0.50
 *      getMinDisplayAmount("jpy") → 50
 */
export function getMinDisplayAmount(currencyCode: string): number {
  const currency = getCurrency(currencyCode);
  return fromSmallestUnit(currency.minAmount, currencyCode);
}
