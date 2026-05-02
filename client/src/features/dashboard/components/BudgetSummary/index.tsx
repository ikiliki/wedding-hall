import { LogoutButton } from "@/shared/components/LogoutButton";
import type { WeddingBudget } from "@/shared/lib/types";
import { formatILS } from "@/shared/lib/venue-pricing";
import * as styles from "./BudgetSummary.styles";

const TIER_LABEL: Record<WeddingBudget["venue_price_type"], string> = {
  cheap: "Cheap",
  average: "Average",
  premium: "Premium",
  custom: "Custom",
};

type Props = { budget: WeddingBudget };

export function BudgetSummary({ budget }: Props) {
  const venueLabel =
    budget.venue_price_type === "custom" && budget.venue_name
      ? budget.venue_name
      : TIER_LABEL[budget.venue_price_type];

  return (
    <main className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Your wedding</p>
          <h1 className={styles.couple}>
            {budget.couple_name_1} & {budget.couple_name_2}
          </h1>
        </div>
        <LogoutButton />
      </div>

      <section className={styles.card}>
        <p className={styles.totalEyebrow}>Estimated venue total</p>
        <p className={styles.totalAmount}>{formatILS(budget.estimated_total)}</p>

        <dl className={styles.breakdown}>
          <div className={styles.row}>
            <dt className={styles.rowKey}>When</dt>
            <dd className={styles.rowValue}>{budget.preferred_day ?? "TBD"}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.rowKey}>Guests</dt>
            <dd className={styles.rowValue}>{budget.guest_count}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.rowKey}>Type</dt>
            <dd className={styles.rowValue}>Hall</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.rowKey}>Venue</dt>
            <dd className={styles.rowValue}>{venueLabel}</dd>
          </div>
          <div className={styles.rowLast}>
            <dt className={styles.rowKey}>Per guest</dt>
            <dd className={styles.rowValue}>
              {formatILS(budget.venue_price_per_guest)}
            </dd>
          </div>
        </dl>
      </section>

      <p className={styles.note}>
        This is a venue-only estimate. More categories coming soon.
      </p>
    </main>
  );
}

export default BudgetSummary;
