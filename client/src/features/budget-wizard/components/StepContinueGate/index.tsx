import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { WizardLayout } from "@/shared/components/WizardLayout";
import { formatILS } from "@/shared/lib/venue-pricing";
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
    setContinuedExtended(continued);
    try {
      await saveServer();
      navigate(continued ? urlFor("bride") : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your budget.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WizardLayout
      stepNumber={stepNumber("continue_gate")}
      totalSteps={TOTAL_STEPS}
      eyebrow="Halfway"
      title="The basics are in."
      subtitle="You've got a venue-side estimate. Want to keep going with the full breakdown — bride, groom, transport, hidden costs — or call it for now and look at the dashboard?"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => persistAndGo(false)}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save & go to dashboard"}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => persistAndGo(true)}
            disabled={saving}
          >
            {saving ? "Saving…" : "Keep building"}
          </Button>
        </>
      }
      errorMessage={error}
      showSummary
      runningTotal={total}
      summaryLines={totalLines}
    >
      <div className="rounded-3xl border border-line bg-surfaceRaised/60 p-8 shadow-luxe">
        <p className="text-[10px] uppercase tracking-luxe text-muted">
          Estimated so far
        </p>
        <p className="mt-3 font-serif text-5xl tabular-nums">{formatILS(total)}</p>
        <p className="mt-3 text-sm text-muted">
          Based on the {totalLines.length} categor{totalLines.length === 1 ? "y" : "ies"} you've answered.
        </p>
      </div>
    </WizardLayout>
  );
}

export default StepContinueGate;
