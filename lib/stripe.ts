import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_API_KEY;
    if (!key) {
      throw new Error("STRIPE_API_KEY is not set");
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

// For backward compatibility — lazy getter
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});
