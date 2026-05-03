import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { WizardLayout } from "@/shared/components/WizardLayout";
import { formatILS } from "@/shared/lib/venue-pricing";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { TOTAL_STEPS, stepNumber } from "@/features/budget-wizard/state/steps";

export function StepCompletion() {
  const navigate = useNavigate();
  const { total, totalLines, saveServer } = useWizard();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(true);
  const ranOnce = useRef(false);

  // Auto-save the completed budget the moment we land here. The "Continue?"
  // gate already saved once, but the extended branch added more line items
  // we haven't persisted yet.
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    (async () => {
      try {
        await saveServer();
      } catch (err) {
        setError(err instanceof Error ? err.message : "לא ניתן לשמור.");
      } finally {
        setSaving(false);
      }
    })();
  }, [saveServer]);

  return (
    <WizardLayout
      currentStepId="completion"
      stepNumber={stepNumber("completion")}
      totalSteps={TOTAL_STEPS}
      title="בניתם את האומדן."
      subtitle="זה סיכום התקציב המלא. במסך התקציב תראו פירוט לפי קטגוריות ותוכלו למלא מחירים אמיתיים ברגע שסוגרים עם ספקים."
      footer={
        <div className="wh-wizard-stitch-footer-actions">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="wh-wizard-stitch-next"
            onClick={() => navigate("/budget")}
            disabled={saving}
          >
            {saving ? "שומרים…" : "מעבר לתקציב"}
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/dashboard")}
          >
            דף הבית
          </Button>
        </div>
      }
      errorMessage={error}
    >
      <div className="wh-wizard-stat-card">
        <p className="wh-wizard-stat-eyebrow">סה״כ אומדן</p>
        <p className="wh-wizard-stat-sum-xl">{formatILS(total)}</p>
        <p className="wh-wizard-stat-sub">
          {totalLines.length === 1
            ? "קטגוריה אחת נכללה באומדן."
            : `${totalLines.length} קטגוריות נכללו באומדן.`}
        </p>
      </div>
    </WizardLayout>
  );
}

export default StepCompletion;
