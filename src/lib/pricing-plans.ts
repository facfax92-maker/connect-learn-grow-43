import { formatNPR, PRICE_RANGE } from "@/lib/constants";

export type BillingMode = "month" | "session";
export type PricingCell = string | boolean;

export const PRICING_ROWS = [
  { key: "lessons", label: "Example lessons" },
  { key: "length", label: "Lesson length" },
  { key: "where", label: "Where you meet" },
  { key: "choose", label: "Choose your tutor" },
  { key: "same", label: "Same tutor each week" },
  { key: "changes", label: "Session changes" },
  { key: "fee", label: "Your platform fee" },
  { key: "pay", label: "Pay with" },
] as const;

export type PricingRowKey = (typeof PRICING_ROWS)[number]["key"];

export type PricingPlan = {
  id: string;
  name: string;
  blurb: string;
  /** Null when lessons are booked one at a time instead of as a month. */
  sessions: number | null;
  perSession: number;
  featured: boolean;
  badge: string | null;
  cta: string;
  href: string;
  features: Record<PricingRowKey, PricingCell>;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "drop-in",
    name: "Drop-in",
    blurb: "One lesson when you need it. Pay only for the session you book.",
    sessions: null,
    perSession: 800,
    featured: false,
    badge: null,
    cta: "Browse tutors",
    href: "/tutors",
    features: {
      lessons: "One at a time",
      length: "30 min–2 hours",
      where: "Online or in person",
      choose: true,
      same: "Optional",
      changes: "Free, 24h ahead",
      fee: "None",
      pay: "eSewa or Khalti",
    },
  },
  {
    id: "monthly",
    name: "Monthly",
    blurb: "A standing weekly rhythm with one tutor.",
    sessions: 8,
    perSession: 750,
    featured: true,
    badge: "Most chosen",
    cta: "Find a tutor",
    href: "/tutors",
    features: {
      lessons: "8 a month",
      length: "1 hour",
      where: "Online or in person",
      choose: true,
      same: true,
      changes: "Agree with your tutor",
      fee: "None",
      pay: "eSewa or Khalti",
    },
  },
  {
    id: "exam",
    name: "Exam season",
    blurb: "More lessons through SEE, NEB, or entrance season.",
    sessions: 12,
    perSession: 1000,
    featured: false,
    badge: null,
    cta: "Find a tutor",
    href: "/tutors",
    features: {
      lessons: "12 a month",
      length: "1–1.5 hours",
      where: "Online or in person",
      choose: true,
      same: true,
      changes: "Agree with your tutor",
      fee: "None",
      pay: "eSewa or Khalti",
    },
  },
];

export const FINDERS_FEE_PERCENT = 25;

export function displayPrice(plan: PricingPlan, mode: BillingMode): {
  amount: number;
  cadence: string;
  aside: string | null;
} {
  if (plan.sessions == null) {
    return {
      amount: plan.perSession,
      cadence: "per session you book",
      aside: null,
    };
  }

  const monthly = plan.perSession * plan.sessions;
  if (mode === "session") {
    return {
      amount: plan.perSession,
      cadence: "per session",
      aside: `${formatNPR(monthly)} per month`,
    };
  }

  return {
    amount: monthly,
    cadence: "per month",
    aside: `${formatNPR(plan.perSession)} per session`,
  };
}

export function planPriceInRange(plan: PricingPlan): boolean {
  const monthly = plan.sessions == null ? plan.perSession : plan.perSession * plan.sessions;
  return (
    plan.perSession >= PRICE_RANGE.min &&
    plan.perSession <= PRICE_RANGE.max &&
    monthly >= PRICE_RANGE.min &&
    monthly <= PRICE_RANGE.max
  );
}
