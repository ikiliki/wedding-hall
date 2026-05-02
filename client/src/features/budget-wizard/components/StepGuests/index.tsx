import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { Field } from "@/shared/components/Field";
import { WizardLayout } from "@/shared/components/WizardLayout";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { TOTAL_STEPS, stepNumber, urlFor } from "@/features/budget-wizard/state/steps";

export function StepGuests() {
  const navigate = useNavigate();
  const { state, setGuestRange } = useWizard();
  const [min, setMin] = useState<number | "">(state.guestMin);
  const [max, setMax] = useState<number | "">(state.guestMax);

  const valid =
    typeof min === "number" &&
    typeof max === "number" &&
    min > 0 &&
    max >= min;

  function handleNext() {
    if (!valid) return;
    setGuestRange(min as number, max as number);
    navigate(urlFor("type"));
  }

  return (
    <WizardLayout
      stepNumber={stepNumber("guests")}
      totalSteps={TOTAL_STEPS}
      eyebrow="Step 3 — Guests"
      title="How many guests?"
      subtitle="A rough range is fine — we'll use the midpoint to estimate."
      info="A planner's tip — give the venue a *safe* number you're sure about. Going under can mean fines for short attendance; going way over costs you more upfront. Pick a range that genuinely reflects who you'd invite."
      infoTitle="A planner's tip"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => navigate(urlFor("date"))}>
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={!valid}
          >
            Continue
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="guests-min"
          label="Minimum"
          type="number"
          inputMode="numeric"
          min={1}
          step={10}
          value={min === "" ? "" : String(min)}
          onChange={(e) => {
            const v = e.target.value;
            setMin(v === "" ? "" : Math.max(0, Number(v)));
          }}
          placeholder="400"
        />
        <Field
          id="guests-max"
          label="Maximum"
          type="number"
          inputMode="numeric"
          min={1}
          step={10}
          value={max === "" ? "" : String(max)}
          onChange={(e) => {
            const v = e.target.value;
            setMax(v === "" ? "" : Math.max(0, Number(v)));
          }}
          placeholder="500"
        />
      </div>
    </WizardLayout>
  );
}

export default StepGuests;
