import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { WeddingBudget } from "@/shared/lib/types";
import {
  ALL_CATEGORIES,
  type CategoryId,
  computeBudgetTotals,
  formatILS,
} from "@wedding-hall/shared";
import {
  celebrationFullDaysRemaining,
  formatCelebrationDisplay,
  isValidCelebrationDate,
} from "@/features/budget-wizard/lib/celebration-date";
import {
  resumeWizardStep,
  wizardStateFromBudget,
} from "@/features/budget-wizard/lib/wizard-state-from-budget";
import { urlFor } from "@/features/budget-wizard/state/steps";
import * as styles from "./BudgetSummary.styles";

const CATEGORY_ICON: Record<CategoryId, string> = {
  venue: "restaurant",
  food_upgrade: "restaurant",
  bar: "local_bar",
  dj: "music_note",
  photo: "photo_camera",
  flowers: "brush",
  planner: "event",
  addons: "add_circle",
  bride: "checkroom",
  groom: "apparel",
  villa: "villa",
  transport: "directions_bus",
  car_rental: "directions_car",
  makeup: "brush",
  hidden_costs: "savings",
};

const INSPIRATION_IMG =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80";

type Props = { budget: WeddingBudget };

function weddingBanner(isoRaw: string) {
  const iso = isoRaw.trim();
  if (!isValidCelebrationDate(iso)) return null;
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  const startMs = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const endMs = startMs + 86400000;
  const now = Date.now();
  if (now >= endMs) return { variant: "past" as const };
  const daysWhole = celebrationFullDaysRemaining(iso);
  const onDay =
    typeof daysWhole === "number" && daysWhole <= 0 && now >= startMs;
  if (onDay) return { variant: "today" as const, iso };
  return {
    variant: "upcoming" as const,
    days: typeof daysWhole === "number" ? Math.max(daysWhole, 0) : 0,
    iso,
  };
}

export function BudgetSummary({ budget }: Props) {
  const selections = budget.selections?.selections ?? {};
  const guestMid =
    budget.guest_count ||
    Math.round(((budget.guest_count_min ?? 0) + (budget.guest_count_max ?? 0)) / 2);
  const totals = computeBudgetTotals(selections, guestMid);

  const totalAnswerable = ALL_CATEGORIES.length;
  const answered = ALL_CATEGORIES.filter((c) => selections[c.id]).length;
  const completion = totalAnswerable === 0 ? 0 : answered / totalAnswerable;
  const pct = Math.round(completion * 100);

  const resumeTo = useMemo(
    () => urlFor(resumeWizardStep(wizardStateFromBudget(budget))),
    [budget],
  );

  const weddingIso = budget.wedding_date?.trim() ?? "";
  const banner = weddingBanner(weddingIso);
  const dateStepHref = urlFor("date");

  const topLines = useMemo(() => {
    return [...totals.lines]
      .filter((l) => l.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [totals.lines]);

  const venueLine =
    budget.venue_name?.trim() ||
    (budget.selections?.selections?.venue ? "לאולם נבחר" : null);

  return (
    <>
      <section className={styles.welcomeBlock}>
        <h2 className={styles.welcomeTitle}>
          שלום, {budget.couple_name_1}{" "}
          <span className={styles.amp}>&</span> {budget.couple_name_2}!
        </h2>
        <p className={styles.welcomeSub}>
          כיף לראות אתכם שוב. בואו נבדוק איפה עומד התקציב שלכם.
        </p>
        <p className={styles.inlineLinks}>
          <Link className={styles.mutedLink} to={resumeTo}>
            עדכון בשאלון
          </Link>
          <span aria-hidden className="wh-dash-bento-link-sep">
            ·
          </span>
          <Link className={styles.mutedLink} to="/budget">
            מסך תקציב מלא
          </Link>
        </p>
      </section>

      <div className={styles.grid}>
        {banner?.variant === "upcoming" ? (
          <div className={`${styles.bentoCard} wh-dash-bento-span-2`}>
            <div className="wh-dash-bento-countdown-inner">
              <div>
                <span className={styles.countdownEyebrow}>החתונה בעוד</span>
                <div className={styles.countdownRow}>
                  <span className={styles.countdownDays}>{banner.days}</span>
                  <span className={styles.countdownUnit}>ימים</span>
                </div>
                <p className={styles.countdownMetaLine}>
                  {formatCelebrationDisplay(banner.iso)}
                  {venueLine ? ` · ${venueLine}` : ""}
                </p>
                <Link
                  className={styles.mutedLink}
                  to={dateStepHref}
                  style={{ display: "block", marginTop: "0.5rem" }}
                >
                  שינוי תאריך
                </Link>
              </div>
              <div className={`${styles.countdownDeco} material-symbols-outlined`}>
                favorite
              </div>
            </div>
          </div>
        ) : banner?.variant === "today" ? (
          <div className={`${styles.bentoCard} wh-dash-bento-span-2`}>
            <div className="wh-dash-bento-countdown-inner">
              <div>
                <span className={styles.countdownEyebrow}>החגיגה מתחילה</span>
                <div className={styles.countdownRow}>
                  <span className={styles.countdownDays}>היום</span>
                </div>
                <p className={styles.countdownMetaLine}>
                  {formatCelebrationDisplay(banner.iso)}
                  {venueLine ? ` · ${venueLine}` : ""}
                </p>
              </div>
              <div className={`${styles.countdownDeco} material-symbols-outlined`}>
                favorite
              </div>
            </div>
          </div>
        ) : banner?.variant === "past" ? (
          <div className={`${styles.bentoCard} wh-dash-bento-span-2`}>
            <div className="wh-dash-bento-countdown-inner">
              <div>
                <span className={styles.countdownEyebrow}>אחרי האירוע</span>
                <p className={styles.countdownMetaLine}>מזל טוב ובהצלחה לחיים המשותפים!</p>
              </div>
              <div className={`${styles.countdownDeco} material-symbols-outlined`}>
                favorite
              </div>
            </div>
          </div>
        ) : (
          <Link
            to={dateStepHref}
            className={`${styles.bentoCard} ${styles.countdownEmptyHint} wh-dash-bento-span-2`}
          >
            קביעת תאריך חתונה — שלב 2 בשאלון
          </Link>
        )}

        <div className={styles.bentoCard}>
          <span className={styles.kpiLabel}>התקדמות כללית</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{pct}%</span>
            <div className={styles.kpiTrack}>
              <div
                className={styles.kpiFill}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <p className={styles.countdownMetaLine} style={{ marginTop: "0.75rem" }}>
            {answered} מתוך {totalAnswerable} קטגוריות
          </p>
        </div>

        <div className={styles.bentoCard}>
          <span className={styles.kpiLabel}>סה״כ משוער</span>
          <p className={styles.kpiMoney}>
            {formatILS(totals.total > 0 ? totals.total : budget.estimated_total)}
          </p>
        </div>

        <div className={`${styles.quickGridWrap} wh-dash-bento-span-2`}>
          <div className={styles.quickGrid}>
            <Link
              to="/budget"
              className={`${styles.quickBtn} ${styles.quickPrimary}`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span>
              <span className="wh-dash-bento-quick-label">תקציב</span>
            </Link>
            <div className={`${styles.quickBtn} ${styles.quickSoon}`}>
              <span className="material-symbols-outlined">groups</span>
              <span className="wh-dash-bento-quick-label">ספקים</span>
              <span className={styles.quickSoonBadge}>בקרוב</span>
            </div>
            <div className={`${styles.quickBtn} ${styles.quickSoon}`}>
              <span className="material-symbols-outlined">shopping_bag</span>
              <span className="wh-dash-bento-quick-label">רכישות</span>
              <span className={styles.quickSoonBadge}>בקרוב</span>
            </div>
            <div className={`${styles.quickBtn} ${styles.quickSoon}`}>
              <span className="material-symbols-outlined">web</span>
              <span className="wh-dash-bento-quick-label">האתר שלי</span>
              <span className={styles.quickSoonBadge}>בקרוב</span>
            </div>
          </div>
        </div>

        <div className={`${styles.breakdown} wh-dash-bento-span-2`}>
          <div className={styles.breakdownHead}>
            <h3 className="wh-dash-bento-break-title">פירוט הערכות</h3>
            <Link
              to={resumeTo}
              className="material-symbols-outlined wh-dash-bento-analytics"
              aria-label="המשך בשאלון"
              title="המשך בשאלון"
            >
              analytics
            </Link>
          </div>
          <div className={styles.breakdownRows}>
            {topLines.length === 0 ? (
              <p className={styles.countdownMetaLine}>
                השלימו את השאלון כדי לראות פירוט לפי קטגוריות.
              </p>
            ) : (
              topLines.map((line) => (
                <div key={line.categoryId} className={styles.breakdownRow}>
                  <span className="wh-dash-bento-break-amount">
                    {formatILS(line.amount)}
                  </span>
                  <div className="wh-dash-bento-break-main">
                    <span className="wh-dash-bento-break-label">{line.label}</span>
                    <div className={styles.breakdownIcWrap}>
                      <span className="material-symbols-outlined">
                        {CATEGORY_ICON[line.categoryId] ?? "payments"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`${styles.heroWide} wh-dash-bento-span-row`}>
          <img
            className={styles.heroImg}
            alt=""
            src={INSPIRATION_IMG}
            loading="lazy"
          />
          <div className={styles.heroGrad}>
            <p className="wh-dash-bento-hero-h">השראה יומית</p>
            <p className="wh-dash-bento-hero-q">
              &quot;עיצוב הוא לא רק איך שזה נראה, אלא איך שזה מרגיש.&quot;
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default BudgetSummary;
