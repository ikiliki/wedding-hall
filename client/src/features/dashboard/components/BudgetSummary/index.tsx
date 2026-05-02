import { Link } from "react-router-dom";
import type { WeddingBudget } from "@/shared/lib/types";
import {
  ALL_CATEGORIES,
  computeBudgetTotals,
  formatILS,
} from "@wedding-hall/shared";
import { ProgressBar } from "@/shared/components/ProgressBar";
import * as styles from "./BudgetSummary.styles";

const DAY_LABEL: Record<string, string> = {
  sun_tue: "Sun – Tue",
  wed: "Wednesday",
  thu: "Thursday",
  fri_short: "Friday — short",
  fri_full: "Friday — full",
};

type Props = { budget: WeddingBudget };

export function BudgetSummary({ budget }: Props) {
  const selections = budget.selections?.selections ?? {};
  const guestMid =
    budget.guest_count ||
    Math.round(((budget.guest_count_min ?? 0) + (budget.guest_count_max ?? 0)) / 2);
  const totals = computeBudgetTotals(selections, guestMid);

  // Completion = "how many catalog categories have an answer".
  const totalAnswerable = ALL_CATEGORIES.length;
  const answered = ALL_CATEGORIES.filter((c) => selections[c.id]).length;
  const completion = totalAnswerable === 0 ? 0 : answered / totalAnswerable;

  const guestRange =
    typeof budget.guest_count_min === "number" &&
    typeof budget.guest_count_max === "number"
      ? `${budget.guest_count_min}–${budget.guest_count_max} guests`
      : `${budget.guest_count} guests`;

  const dayLabel = budget.preferred_day
    ? (DAY_LABEL[budget.preferred_day] ?? budget.preferred_day)
    : "Date TBD";

  return (
    <>
      <section className={styles.headerCard}>
        <p className={styles.headerEyebrow}>Your wedding</p>
        <h1 className={styles.headerCouple}>
          {budget.couple_name_1} <span className={styles.amp}>&</span> {budget.couple_name_2}
        </h1>
        <div className={styles.headerMeta}>
          <span>{dayLabel}</span>
          <span>{guestRange}</span>
          {budget.venue_name && <span>{budget.venue_name}</span>}
        </div>
        <div className={styles.headerProgressRow}>
          <ProgressBar
            value={completion}
            label={`${answered} of ${totalAnswerable} categories`}
          />
        </div>
      </section>

      <section className={styles.totalsRow}>
        <div className={styles.totalCard}>
          <p className={styles.totalEyebrow}>Estimated total</p>
          <p className={styles.totalAmount}>
            {formatILS(totals.total > 0 ? totals.total : budget.estimated_total)}
          </p>
          <p className={styles.totalSub}>
            From your latest answers. Open the budget view to compare with your
            real prices.
          </p>
          <div className={styles.totalCta}>
            <Link to="/budget" className={styles.totalCtaLink}>
              View full budget →
            </Link>
            <Link to="/start" className={styles.totalCtaLinkMuted}>
              Edit answers
            </Link>
          </div>
        </div>

        <div className={styles.tilesCol}>
          <Tile
            eyebrow="Continue"
            title="Pick up where you left off"
            body="Walk through the remaining categories — bride, groom, transport, hidden costs."
            cta="Resume wizard"
            to="/start"
          />
          <Tile
            eyebrow="Vendors"
            title="Recommended vendors"
            body="Coming soon — curated, vetted suppliers grouped by budget tier."
            cta="Browse"
            to="/dashboard/vendors"
            disabled
          />
          <Tile
            eyebrow="Save the date"
            title="Website & invites"
            body="Coming soon — generate a save-the-date page with your couple name + date."
            cta="Open"
            to="/dashboard/site"
            disabled
          />
        </div>
      </section>
    </>
  );
}

type TileProps = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  to: string;
  disabled?: boolean;
};

function Tile({ eyebrow, title, body, cta, to, disabled }: TileProps) {
  if (disabled) {
    return (
      <div className={styles.tile} aria-disabled>
        <div>
          <p className={styles.tileEyebrow}>{eyebrow}</p>
          <h2 className={styles.tileTitle}>{title}</h2>
          <p className={styles.tileBody}>{body}</p>
        </div>
        <p className={styles.tileCtaMuted}>{cta} (soon)</p>
      </div>
    );
  }
  return (
    <Link to={to} className={styles.tile}>
      <div>
        <p className={styles.tileEyebrow}>{eyebrow}</p>
        <h2 className={styles.tileTitle}>{title}</h2>
        <p className={styles.tileBody}>{body}</p>
      </div>
      <p className={styles.tileCta}>{cta}</p>
    </Link>
  );
}

export default BudgetSummary;
