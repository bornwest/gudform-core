export interface PaymentOption {
  id: string; // generated client-side (crypto.randomUUID)
  label: string; // e.g. "Basic", "Premium"
  amount: number; // smallest currency unit (cents)
}

export type PaymentSelectionMode = "single" | "multi";

/**
 * Returns true when the form uses multi-tier payment options.
 */
export function isPaymentOptionsForm(form: {
  paymentEnabled: boolean;
  paymentOptions?: PaymentOption[] | null;
}): boolean {
  return (
    form.paymentEnabled &&
    Array.isArray(form.paymentOptions) &&
    form.paymentOptions.length > 0
  );
}

/**
 * Returns true when the form uses legacy single-amount payment.
 */
export function isLegacyPaymentForm(form: {
  paymentEnabled: boolean;
  paymentAmount?: number | null;
  paymentOptions?: PaymentOption[] | null;
}): boolean {
  return (
    form.paymentEnabled &&
    !!form.paymentAmount &&
    (!Array.isArray(form.paymentOptions) || form.paymentOptions.length === 0)
  );
}
