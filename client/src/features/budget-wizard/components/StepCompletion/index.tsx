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
        setError(err instanceof Error ? err.message : "Could not save.");
      } finally {
        setSaving(false);
      }
    })();
  }, [saveServer]);

  return (
    <WizardLayout
      stepNumber={stepNumber("completion")}
      totalSteps={TOTAL_STEPS}
      eyebrow="Done"
      title="You've built your budget."
      subtitle="Beautiful — that's the whole estimate. Open the budget view to see line-by-line breakdowns and to fill in your real prices once you start booking."
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/dashboard")}
          >
            Home
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => navigate("/budget")}
            disabled={saving}
          >
            {saving ? "Saving…" : "View budget"}
          </Button>
        </>
      }
      errorMessage={error}
    >
      <div className="rounded-3xl border border-line bg-surfaceRaised/60 p-8 shadow-luxe">
        <p className="text-[10px] uppercase tracking-luxe text-muted">
          Total estimated budget
        </p>
        <p className="mt-3 font-serif text-6xl tabular-nums">{formatILS(total)}</p>
        <p className="mt-3 text-sm text-muted">
          Across {totalLines.length} categor{totalLines.length === 1 ? "y" : "ies"}.
        </p>
      </div>
    </WizardLayout>
  );
}

export default StepCompletion;
