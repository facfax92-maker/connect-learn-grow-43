import { describe, expect, it } from "vitest";
import {
  displayPrice,
  planPriceInRange,
  PRICING_PLANS,
  PRICING_ROWS,
} from "@/lib/pricing-plans";

describe("pricing plans", () => {
  it("gives every plan a value for every comparison row", () => {
    for (const plan of PRICING_PLANS) {
      for (const row of PRICING_ROWS) {
        expect(plan.features[row.key]).toBeDefined();
      }
    }
  });

  it("keeps example rates inside the platform price range", () => {
    expect(PRICING_PLANS.every(planPriceInRange)).toBe(true);
  });

  it("turns a monthly plan into a session rate without changing the total", () => {
    const monthly = PRICING_PLANS.find((plan) => plan.id === "monthly");
    expect(monthly).toBeDefined();
    if (!monthly) return;

    expect(displayPrice(monthly, "month")).toMatchObject({
      amount: 6000,
      cadence: "per month",
      aside: "रू 750 per session",
    });
    expect(displayPrice(monthly, "session")).toMatchObject({
      amount: 750,
      cadence: "per session",
      aside: "रू 6,000 per month",
    });
  });

  it("bills drop-in per session in both views", () => {
    const dropIn = PRICING_PLANS.find((plan) => plan.id === "drop-in");
    expect(dropIn).toBeDefined();
    if (!dropIn) return;

    expect(displayPrice(dropIn, "month").amount).toBe(800);
    expect(displayPrice(dropIn, "session").cadence).toMatch(/session/);
    expect(displayPrice(dropIn, "month").aside).toBeNull();
  });
});
