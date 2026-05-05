import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { InfoIcon } from "@/shared/components/InfoIcon";
import { WizardMiniBudgetSummary } from "@/shared/components/WizardMiniBudgetSummary";
import type { WizardStepId } from "@/features/budget-wizard/state/steps";
import { useWizardSession } from "@/features/budget-wizard/state/wizard-session-context";
import * as styles from "./WizardLayout.styles";

export type SideLine = { label: string; amount: number };

const STEP_TAB: Record<WizardStepId, string> = {
  couple: "שמות",
  date: "תאריך",
  guests: "אורחים",
  type: "סוג",
  venue: "אולם",
  food_upgrade: "תפריט",
  bar: "בר",
  dj: "די ג׳יי",
  photo: "צילום",
  flowers: "פרחים",
  planner: "מתכננת",
  addons: "תוספות",
  continue_gate: "סיכום",
  bride: "כלה",
  groom: "חתן",
  villa: "וילה",
  transport: "הסעות",
  car_rental: "רכב",
  makeup: "איפור",
  hidden_costs: "נסתרות",
  completion: "סיום",
};

/** Right-hand label in the progress row (Stitch “שלב …” strip). */
const PROGRESS_CONTEXT: Partial<Record<WizardStepId, string>> = {
  couple: "שמות החוגגים",
  date: "יום בשבוע ותאריך",
  guests: "כמה אורחים",
  type: "סוג האירוע",
  venue: "בחירת רמת מחיר",
  food_upgrade: "שדרוג תפריט",
  bar: "בר",
  dj: "מוזיקה",
  photo: "צילום וידאו",
  flowers: "פרחים ועיצוב",
  planner: "מתכננת",
  addons: "תוספות",
  continue_gate: "סיכום ביניים",
  bride: "שמלה",
  groom: "לבוש חתן",
  villa: "וילה לצילומים",
  transport: "הסעות",
  car_rental: "רכב",
  makeup: "איפור",
  hidden_costs: "עלויות נסתרות",
  completion: "סיום התהליך",
};

type Props = {
  stepNumber: number;
  totalSteps: number;
  currentStepId: WizardStepId;
  title: string;
  subtitle?: string;
  info?: string;
  infoTitle?: string;
  /** Overrides PROGRESS_CONTEXT for the progress hint (e.g. venue tier step). */
  progressContext?: string;
  children: ReactNode;
  footer: ReactNode;
  errorMessage?: string | null;
  showSummary?: boolean;
  runningTotal?: number;
  summaryLines?: SideLine[];
};

export function WizardLayout({
  stepNumber,
  totalSteps,
  currentStepId,
  title,
  subtitle,
  info,
  infoTitle,
  progressContext,
  children,
  footer,
  errorMessage,
  showSummary = false,
  runningTotal = 0,
  summaryLines = [],
}: Props) {
  const { session, loading } = useWizardSession();
  const location = useLocation();
  const guestChrome = !loading && !session;
  const signInHref = `/login?returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`;

  const progress = Math.min(1, Math.max(0, stepNumber / totalSteps));
  const pct = Math.round(progress * 100);
  const hint =
    progressContext ??
    PROGRESS_CONTEXT[currentStepId] ??
    STEP_TAB[currentStepId] ??
    "";

  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <div className="wh-wizard-stitch-progress">
          <div className="wh-wizard-stitch-progress-labels">
            <span className="wh-wizard-stitch-progress-step">
              שלב {stepNumber} מתוך {totalSteps}
            </span>
            {hint ? (
              <span className="wh-wizard-stitch-progress-hint">{hint}</span>
            ) : (
              <span className="wh-wizard-stitch-progress-hint">
                {STEP_TAB[currentStepId]}
              </span>
            )}
          </div>
          <div
            className="wh-wizard-stitch-progress-track"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`התקדמות ${pct} אחוזים`}
          >
            <div
              className="wh-wizard-stitch-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className={styles.scrollRegion}>
          <div className="wh-wizard-stitch-scroll-frame">
            <div
              dir={showSummary ? "ltr" : undefined}
              className={`${styles.main} wh-wizard-main-grid--stitch${showSummary ? " wh-wizard-main-grid--with-summary" : ""}`}
            >
              <div
                dir={showSummary ? "rtl" : undefined}
                className={`${styles.questionCol} wh-wizard-q-col--stitch-wide`}
              >
                <div className="wh-wizard-headline-stitch">
                  <div className={styles.titleRow}>
                    <h1 className={styles.title}>{title}</h1>
                    {info && (
                      <span className={styles.infoGap}>
                        <InfoIcon title={infoTitle ?? "כדאי לדעת"}>
                          {info}
                        </InfoIcon>
                      </span>
                    )}
                  </div>
                  {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>

                <div className={styles.body}>{children}</div>

                {errorMessage && (
                  <p className={styles.errorRow} role="alert">
                    {errorMessage}
                  </p>
                )}
              </div>
              {showSummary && (
                <aside className="wh-wizard-stitch-summary-aside" dir="rtl">
                  <WizardMiniBudgetSummary
                    total={runningTotal}
                    lines={summaryLines}
                  />
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="wh-wizard-stitch-footer-bar">
        <div className="wh-wizard-stitch-footer-inner">
          <div className="wh-wizard-stitch-footer-row">
            <div className="wh-wizard-stitch-footer-primary">{footer}</div>
            {guestChrome ? (
              <Link to={signInHref} className="wh-wizard-footer-home-link">
                <span className="material-symbols-outlined" aria-hidden>
                  login
                </span>
                <span>התחברות</span>
              </Link>
            ) : (
              <Link to="/dashboard" className="wh-wizard-footer-home-link">
                <span className="material-symbols-outlined" aria-hidden>
                  home
                </span>
                <span>בית</span>
              </Link>
            )}
          </div>
        </div>
      </footer>

      <footer className="wh-wizard-stitch-legal-footer">
        <nav className="wh-wizard-stitch-legal-links" aria-label="מידע משפטי">
          <a href="#">תנאי שימוש</a>
          <a href="#">מדיניות פרטיות</a>
          <a href="#">צור קשר</a>
        </nav>
        <p style={{ margin: 0 }} dir="ltr">
          © Wedding Hall · כל הזכויות שמורות
        </p>
      </footer>
    </main>
  );
}

export default WizardLayout;
