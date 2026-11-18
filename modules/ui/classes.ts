/**
 * Shared class names for the design system (nutrio-design/DESIGN.md).
 * Colors come from the semantic tokens in app/globals.css, so the dark theme
 * needs no `dark:` variants. Prefer these over ad-hoc classes.
 */

/** Page content column inside the app shell. */
export const page = "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-7 px-4 py-8 sm:px-8 md:px-10 md:py-9";
/** Narrow column for forms (sign-in, profile, preferences). */
export const pageNarrow = "mx-auto flex w-full max-w-2xl flex-1 flex-col gap-7 px-4 py-8 sm:px-8 md:py-9";

export const h1 = "text-3xl font-semibold tracking-tight md:text-4xl";
export const h2 = "text-xl font-semibold tracking-tight";
export const h3 = "text-base font-semibold";
/** Small line above a page title (date, context). */
export const eyebrow = "text-sm font-medium text-secondary";
export const muted = "text-sm text-secondary";
/** Figures: kcal, weights, quantities, big dates, KPIs. */
export const figure = "font-mono font-semibold tabular-nums";
export const kpi = "font-mono text-4xl font-semibold leading-none tabular-nums";

/** Large card (sections, panels). */
export const card = "flex flex-col gap-4 rounded-card-lg border border-line bg-surface p-5 md:p-6";
/** Small card (list rows, items). */
export const cardSm = "flex flex-col gap-2 rounded-card border border-line bg-surface p-4";
/** Highlighted card (accent tint, no border). */
export const cardAccent = "flex flex-col gap-3 rounded-card-lg bg-accent-tint p-5 md:p-6";
/** List with dividers inside a card. */
export const list = "flex flex-col divide-y divide-divider";

const control = "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold";
export const buttonPrimary = `${control} bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-50`;
export const buttonSecondary = `${control} border border-line-strong bg-surface text-ink hover:bg-surface-muted disabled:opacity-50`;
export const buttonDanger = `${control} border border-line-strong bg-surface text-danger hover:bg-danger-bg disabled:opacity-50`;
/** Text-only action (inline links that act like buttons). */
export const buttonLink = "inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:text-accent-hover";

export const link = "font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline";

export const input =
  "min-h-11 rounded-control border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
export const textarea =
  "rounded-control border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
export const label = "flex flex-col gap-1.5 text-sm font-medium";
export const fieldHint = "text-xs font-normal text-secondary";
export const fieldError = "text-sm text-danger";
export const formSuccess = "text-sm font-medium text-success";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-secondary",
  accent: "bg-accent-tint text-accent",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
};

/** Status badge. State colors are only for states. */
export function badge(tone: Tone = "neutral") {
  return `inline-flex items-center gap-1 rounded-badge px-2 py-0.5 text-xs font-semibold ${TONES[tone]}`;
}

/** Callout box for a state message (expired access, due check-in…). */
export function callout(tone: Tone = "neutral") {
  return `rounded-card px-4 py-3 text-sm ${TONES[tone]}`;
}
