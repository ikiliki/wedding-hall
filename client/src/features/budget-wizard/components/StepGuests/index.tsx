import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { WizardLayout } from "@/shared/components/WizardLayout";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { TOTAL_STEPS, stepNumber, urlFor } from "@/features/budget-wizard/state/steps";
import { wizardOptLayoutClass } from "@/features/budget-wizard/lib/wizard-option-layout";
import * as styles from "./StepGuests.styles";

const GUEST_SLIDER_MAX = 1000;
const DEFAULT_GUEST_MIN = 100;
const DEFAULT_GUEST_MAX = 300;

function clampGuest(n: number) {
  return Math.min(GUEST_SLIDER_MAX, Math.max(0, Math.round(n)));
}

function formatGuestLabel(n: number) {
  return n >= GUEST_SLIDER_MAX ? "1000+" : String(n);
}

export function StepGuests() {
  const navigate = useNavigate();
  const { state, setGuestRange } = useWizard();

  const [min, setMin] = useState(() =>
    typeof state.guestMin === "number"
      ? clampGuest(state.guestMin)
      : DEFAULT_GUEST_MIN,
  );
  const [max, setMax] = useState(() =>
    typeof state.guestMax === "number"
      ? clampGuest(state.guestMax)
      : DEFAULT_GUEST_MAX,
  );

  const fillLeftPct = (min / GUEST_SLIDER_MAX) * 100;
  const fillWidthPct = Math.max(0, ((max - min) / GUEST_SLIDER_MAX) * 100);

  const valid = max >= min && max >= 1;

  function setMinFromSlider(v: number) {
    const next = clampGuest(v);
    setMin(next);
    setMax((m) => (next > m ? next : m));
  }

  function setMaxFromSlider(v: number) {
    const next = clampGuest(v);
    setMax(next);
    setMin((m) => (next < m ? next : m));
  }

  function handleNext() {
    if (!valid) return;
    setGuestRange(min, max);
    navigate(urlFor("type"));
  }

  return (
    <WizardLayout
      currentStepId="guests"
      stepNumber={stepNumber("guests")}
      totalSteps={TOTAL_STEPS}
      title="כמה אורחים?"
      subtitle="גררו את שני המחוונים כדי לבחור טווח — נשתמש באמצע לאומדן."
      info="טיפ מתכננת — תנו לאולם מספר בטוח שאתם באמת יכולים לעמוד בו. חוסר יכול לגרור קנסות על נוכחות נמוכה; חריגה גדולה עולה יותר מראש. בחרו טווח שמשקף את מי שבאמת תזמינו."
      infoTitle="טיפ מתכננת"
      footer={
        <>
          <div className="wh-wizard-stitch-footer-actions">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleNext}
              disabled={!valid}
              className="wh-wizard-stitch-next"
            >
              המשך
              <span className="material-symbols-outlined" aria-hidden>
                arrow_back
              </span>
            </Button>
          </div>
          <button
            type="button"
            className="wh-wizard-stitch-back"
            onClick={() => navigate(urlFor("date"))}
          >
            <span className="material-symbols-outlined" aria-hidden>
              arrow_forward
            </span>
            חזור
          </button>
        </>
      }
    >
      <section
        className={`${wizardOptLayoutClass} ${styles.rangeSection}`}
        data-layout="range"
        aria-label="טווח מספר אורחים במזער ובמקסימום"
      >
        <p className={styles.rangeSummary} aria-live="polite">
          {formatGuestLabel(min)}–{formatGuestLabel(max)} אורחים
        </p>

        <div dir="ltr" className={styles.rangeTrackWrap}>
          <div className={styles.rangeTrack} aria-hidden />
          <div
            className={styles.rangeFill}
            style={{
              insetInlineStart: `${fillLeftPct}%`,
              width: `${fillWidthPct}%`,
            }}
            aria-hidden
          />
          <input
            type="range"
            className={styles.rangeInput}
            style={{ zIndex: min >= max - 80 ? 5 : 3 }}
            min={0}
            max={GUEST_SLIDER_MAX}
            step={1}
            value={min}
            aria-label="מינימום אורחים"
            aria-valuemin={0}
            aria-valuemax={GUEST_SLIDER_MAX}
            aria-valuenow={min}
            onChange={(e) => setMinFromSlider(Number(e.target.value))}
          />
          <input
            type="range"
            className={styles.rangeInput}
            style={{ zIndex: max <= min + 80 ? 5 : 4 }}
            min={0}
            max={GUEST_SLIDER_MAX}
            step={1}
            value={max}
            aria-label="מקסימום אורחים"
            aria-valuemin={0}
            aria-valuemax={GUEST_SLIDER_MAX}
            aria-valuenow={max}
            onChange={(e) => setMaxFromSlider(Number(e.target.value))}
          />
        </div>

        <div className={styles.rangeEnds}>
          <span>0</span>
          <span>1000+</span>
        </div>
      </section>
    </WizardLayout>
  );
}

export default StepGuests;
