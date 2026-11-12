import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { formatNPR, PRICE_RANGE } from "@/lib/constants";
import {
  displayPrice,
  FINDERS_FEE_PERCENT,
  PRICING_PLANS,
  PRICING_ROWS,
  type BillingMode,
  type PricingCell,
  type PricingPlan,
} from "@/lib/pricing-plans";
import "./PricingTable.css";

const THEME_STORAGE_KEY = "tutorconnect-pricing-theme";

function storedDark(): boolean {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

function CellValue({ value }: { value: PricingCell }) {
  if (typeof value === "boolean") {
    return (
      <span className={value ? "pricing-mark pricing-mark--yes" : "pricing-mark pricing-mark--no"}>
        <span className="pricing-sr">{value ? "Included" : "Not included"}</span>
      </span>
    );
  }
  return <>{value}</>;
}

function PlanSummary({
  plan,
  mode,
  heading,
  headingId,
  reserveBadge = false,
}: {
  plan: PricingPlan;
  mode: BillingMode;
  heading: "h3" | "p";
  headingId?: string;
  reserveBadge?: boolean;
}) {
  const price = displayPrice(plan, mode);
  const Title = heading;

  return (
    <div className="pricing-plan">
      {(plan.badge || reserveBadge) && (
        <span
          className={plan.badge ? "pricing-badge" : "pricing-badge pricing-badge--empty"}
          aria-hidden={plan.badge ? undefined : true}
        >
          {plan.badge ?? "Most chosen"}
        </span>
      )}
      <Title id={headingId} className="pricing-plan__name">
        {plan.name}
      </Title>
      <p className="pricing-plan__blurb">{plan.blurb}</p>
      <p className="pricing-plan__example">Example rate</p>
      <p className="pricing-plan__price">
        <span className="pricing-currency">रू</span>
        <span key={`${plan.id}-${mode}`} className="pricing-amount">
          {price.amount.toLocaleString("en-NP")}
        </span>
      </p>
      <p className="pricing-plan__cadence">{price.cadence}</p>
      <p className="pricing-plan__aside" aria-hidden={price.aside ? undefined : true}>
        {price.aside ?? "\u00a0"}
      </p>
    </div>
  );
}

const PricingTable = () => {
  const [mode, setMode] = useState<BillingMode>("month");
  const [dark, setDark] = useState(storedDark);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      /* Private browsing can reject storage writes. The toggle still works. */
    }
  }, [dark]);

  return (
    <section id="pricing" className={dark ? "pricing dark" : "pricing"} aria-labelledby="pricing-heading">
      <div className="container px-4">
        <h2 id="pricing-heading" className="pricing-heading">
          Pricing
        </h2>
        <p className="pricing-intro">
          Pay your tutor directly. These example budgets show what students across Nepal typically spend.
        </p>

        <div className="pricing-toolbar">
          <div className="pricing-toggle" role="group" aria-label="Price display">
            <button type="button" aria-pressed={mode === "month"} onClick={() => setMode("month")}>
              Monthly
            </button>
            <button type="button" aria-pressed={mode === "session"} onClick={() => setMode("session")}>
              Per session
            </button>
          </div>
        </div>
        <p className="pricing-sr" aria-live="polite">
          {mode === "month" ? "Showing monthly example prices" : "Showing per-session example prices"}
        </p>

        <div className="pricing-board">
          <button
            type="button"
            className="pricing-theme"
            aria-pressed={dark}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setDark((on) => !on)}
          >
            {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
        <div className="pricing-compare">
          <table className="pricing-table">
            <caption className="pricing-sr">
              Example tutoring budgets for Drop-in, Monthly, and Exam season
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="pricing-sr">Feature</span>
                </th>
                {PRICING_PLANS.map((plan) => (
                  <th key={plan.id} scope="col" className={plan.featured ? "is-featured" : undefined}>
                    <PlanSummary plan={plan} mode={mode} heading="p" reserveBadge />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRICING_ROWS.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {PRICING_PLANS.map((plan) => (
                    <td key={plan.id} className={plan.featured ? "is-featured" : undefined}>
                      <CellValue value={plan.features[row.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">
                  <span className="pricing-sr">Choose</span>
                </th>
                {PRICING_PLANS.map((plan) => (
                  <td key={plan.id} className={plan.featured ? "is-featured" : undefined}>
                    <Link
                      to={plan.href}
                      className={plan.featured ? "pricing-cta pricing-cta--primary" : "pricing-cta"}
                    >
                      {plan.cta}
                    </Link>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="pricing-cards">
          {PRICING_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={plan.featured ? "pricing-card is-featured" : "pricing-card"}
              aria-labelledby={`pricing-card-${plan.id}`}
            >
              <PlanSummary
                plan={plan}
                mode={mode}
                heading="h3"
                headingId={`pricing-card-${plan.id}`}
              />
              <ul className="pricing-card__features">
                {PRICING_ROWS.map((row) => (
                  <li key={row.key}>
                    <span className="pricing-card__label">{row.label}</span>
                    <span className="pricing-card__value">
                      <CellValue value={plan.features[row.key]} />
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to={plan.href}
                className={plan.featured ? "pricing-cta pricing-cta--primary" : "pricing-cta"}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
        </div>

        <p className="pricing-note">
          Example rates only. Tutors set their own price, from {formatNPR(PRICE_RANGE.min)} to{" "}
          {formatNPR(PRICE_RANGE.max)}. Students pay the tutor directly. TutorConnect charges tutors a
          one-time finder's fee, {FINDERS_FEE_PERCENT}% of the first month by default, when a connection
          is confirmed, then nothing more for that student.{" "}
          <Link to="/signup?intent=tutor">Become a tutor</Link>
        </p>
      </div>
    </section>
  );
};

export default PricingTable;
