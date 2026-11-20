// Public profile a nutritionist edits and clients see in the directory before requesting.
import type { Locale } from "@/lib/i18n/negotiate";
import { nutritionistErrors } from "./messages";

export const FEE_CURRENCIES = ["ARS", "USD"] as const;
export type FeeCurrency = (typeof FEE_CURRENCIES)[number];

export const PUBLIC_PROFILE_LIMITS = {
  bio: 1000,
  education: 500,
  planIncludes: 1000,
  feeDescription: 200,
} as const;

const MAX_FEE = 10_000_000;

export type PublicProfile = {
  bio: string | null;
  education: string | null;
  planIncludes: string | null;
  /** Decimal as a string with 2 decimals (e.g. "25000.00"), ready for Prisma. */
  feeAmount: string | null;
  feeCurrency: FeeCurrency;
  feeDescription: string | null;
};
export type PublicProfileField = keyof PublicProfile;

export class InvalidPublicProfileError extends Error {
  constructor(readonly problems: Partial<Record<PublicProfileField, string>>) {
    super(`Invalid public profile: ${Object.values(problems).join("; ")}`);
    this.name = "InvalidPublicProfileError";
  }
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// Digits with an optional dot or comma and up to 2 decimals; no thousands separators.
const AMOUNT = /^\d+(?:[.,]\d{1,2})?$/;

/** Validates and normalizes public profile input, reporting every invalid field at once. */
export function parsePublicProfile(input: Record<string, unknown>, locale: Locale = "en"): PublicProfile {
  const t = nutritionistErrors[locale];
  const problems: Partial<Record<PublicProfileField, string>> = {};

  const texts = {} as Record<keyof typeof PUBLIC_PROFILE_LIMITS, string | null>;
  for (const field of Object.keys(PUBLIC_PROFILE_LIMITS) as (keyof typeof PUBLIC_PROFILE_LIMITS)[]) {
    const value = text(input[field]);
    const limit = PUBLIC_PROFILE_LIMITS[field];
    if (value.length > limit) problems[field] = t.textTooLong(t.publicFields[field], limit);
    texts[field] = value || null;
  }

  let feeAmount: string | null = null;
  const rawAmount = text(input.feeAmount);
  if (rawAmount) {
    const amount = AMOUNT.test(rawAmount) ? Number(rawAmount.replace(",", ".")) : NaN;
    if (!(amount > 0 && amount <= MAX_FEE)) {
      problems.feeAmount = t.feeAmount;
    } else {
      feeAmount = amount.toFixed(2);
    }
  }

  const rawCurrency = text(input.feeCurrency) || "ARS";
  const feeCurrency = FEE_CURRENCIES.find((currency) => currency === rawCurrency);
  if (!feeCurrency) problems.feeCurrency = t.feeCurrency;

  if (Object.keys(problems).length > 0) throw new InvalidPublicProfileError(problems);

  return {
    bio: texts.bio,
    education: texts.education,
    planIncludes: texts.planIncludes,
    feeAmount,
    feeCurrency: feeCurrency!,
    feeDescription: texts.feeDescription,
  };
}

/** "ARS $150.000,50" or "USD $200": decimals only when the amount has cents. */
export function formatPrice(amount: string | number | { toString(): string }, currency: string): string {
  const value = Number(amount.toString());
  const decimals = Number.isInteger(value) ? 0 : 2;
  const number = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return `${currency} $${number}`;
}

/** "ARS $25.000 · per month"; null when no fee amount is set. */
export function formatFee(fee: {
  feeAmount: string | number | { toString(): string } | null;
  feeCurrency: string;
  feeDescription: string | null;
}): string | null {
  if (fee.feeAmount === null) return null;
  const price = formatPrice(fee.feeAmount, fee.feeCurrency);
  return fee.feeDescription ? `${price} · ${fee.feeDescription}` : price;
}
