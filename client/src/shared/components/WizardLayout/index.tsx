import { Link } from "react-router-dom";
import { formatILS } from "@/shared/lib/venue-pricing";
import { ProgressBar } from "@/shared/components/ProgressBar";
import { InfoIcon } from "@/shared/components/InfoIcon";
import * as styles from "./WizardLayout.styles";

export type SideLine = { label: string; amount: number };

type Props = {
  // Header / progress
  stepNumber: number;
  totalSteps: number;
  // Question
  eyebrow?: string;
  title: string;
  subtitle?: string;
  info?: string;
  infoTitle?: string;
  // Body + footer slots
  children: React.ReactNode;
  footer: React.ReactNode;
  errorMessage?: string | null;
  // Right-hand summary (optional — hidden on welcome / couple steps)
  showSummary?: boolean;
  runningTotal?: number;
  summaryLines?: SideLine[];
};

export function WizardLayout({
  stepNumber,
  totalSteps,
  eyebrow,
  title,
  subtitle,
  info,
  infoTitle,
  children,
  footer,
  errorMessage,
  showSummary = false,
  runningTotal = 0,
  summaryLines = [],
}: Props) {
  const progress = stepNumber / totalSteps;

  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.topBar}>
          <Link to="/" className={styles.brand} aria-label="Home">
            Wedding Hall
          </Link>
          <span className={styles.stepCounter}>
            Step {stepNumber} of {totalSteps}
          </span>
        </div>

        <div className={styles.progressRow}>
          <ProgressBar value={progress} label={`${Math.round(progress * 100)}%`} />
        </div>

        <div className={styles.main}>
          <div className={styles.questionCol}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{title}</h1>
              {info && (
                <span className="mt-3">
                  <InfoIcon title={infoTitle ?? "Worth knowing"}>{info}</InfoIcon>
                </span>
              )}
            </div>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

            <div className={styles.body}>{children}</div>

            {errorMessage && (
              <p className={styles.errorRow} role="alert">
                {errorMessage}
              </p>
            )}

            <div className={styles.footer}>{footer}</div>
          </div>

          {showSummary && (
            <aside className={styles.sideCol}>
              <div className={styles.sidePanel}>
                <p className={styles.sideEyebrow}>Running estimate</p>
                <p className={styles.sideAmount}>{formatILS(runningTotal)}</p>
                <p className={styles.sideHint}>
                  Updates as you make choices. The server recomputes the
                  authoritative total when you save.
                </p>
                {summaryLines.length === 0 ? (
                  <p className={styles.sideEmpty}>
                    Pick a venue tier to start filling in your budget.
                  </p>
                ) : (
                  <dl className={styles.sideLines}>
                    {summaryLines.map((line) => (
                      <div key={line.label} className={styles.sideLine}>
                        <dt className={styles.sideLineLabel}>{line.label}</dt>
                        <dd className={styles.sideLineAmount}>
                          {formatILS(line.amount)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}

export default WizardLayout;
