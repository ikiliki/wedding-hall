import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { WizardLayout } from "@/shared/components/WizardLayout";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { TOTAL_STEPS, stepNumber, urlFor } from "@/features/budget-wizard/state/steps";

export function StepContinueGate() {
  const navigate = useNavigate();
  const { total, totalLines, setContinuedExtended, saveServer } = useWizard();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persistAndGo(continued: boolean) {
    setError(null);
    setSaving(true);
    try {
      await saveServer({ continuedExtended: continued });
      setContinuedExtended(continued);
      navigate(continued ? urlFor("bride") : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "לא ניתן לשמור את התקציב כעת.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WizardLayout
      currentStepId="continue_gate"
      stepNumber={stepNumber("continue_gate")}
      totalSteps={TOTAL_STEPS}
      title="הבסיס אצלנו במערכת."
      subtitle="יש לכם אומדן צד אולם. רוצים להמשיך לפירוט המלא — כלה, חתן, הסעות, עלויות נסתרות — או לעצור כאן ולעבור ללוח הבקרה?"
      footer={
        <>
          <div className="wh-wizard-stitch-footer-actions">
            <div className="wh-wizard-footer-actions-stack">
              <Button
                type="button"
                variant="secondary"
                onClick={() => persistAndGo(false)}
                disabled={saving}
              >
                {saving ? "שומרים…" : "שמירה ומעבר ללוח הבקרה"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="wh-wizard-stitch-next"
                onClick={() => persistAndGo(true)}
                disabled={saving}
              >
                {saving ? "שומרים…" : "להמשיך לבנות"}
                <span className="material-symbols-outlined" aria-hidden>
                  arrow_back
                </span>
              </Button>
            </div>
          </div>
          <button
            type="button"
            className="wh-wizard-stitch-back"
            onClick={() => navigate(urlFor("addons"))}
            disabled={saving}
          >
            <span className="material-symbols-outlined" aria-hidden>
              arrow_forward
            </span>
            חזור
          </button>
        </>
      }
      errorMessage={error}
      showSummary
      runningTotal={total}
      summaryLines={totalLines}
    >
      <p className="wh-wizard-continue-gate-hint">
        האומדן המעודכן מוצג למעלה. בשלב הבא הנתונים נשמרים בשרת — בחרו אם
        להרחיב את השאלון או לעבור ללוח הבקרה.
      </p>
    </WizardLayout>
  );
}

export default StepContinueGate;
