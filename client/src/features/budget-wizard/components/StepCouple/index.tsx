import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { Field } from "@/shared/components/Field";
import { WizardLayout } from "@/shared/components/WizardLayout";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { TOTAL_STEPS, stepNumber, urlFor } from "@/features/budget-wizard/state/steps";

export function StepCouple() {
  const navigate = useNavigate();
  const { state, setCouple } = useWizard();
  const [name1, setName1] = useState(state.coupleName1);
  const [name2, setName2] = useState(state.coupleName2);

  const valid = name1.trim().length > 0 && name2.trim().length > 0;

  function handleNext() {
    if (!valid) return;
    setCouple(name1.trim(), name2.trim());
    navigate(urlFor("date"));
  }

  return (
    <WizardLayout
      stepNumber={stepNumber("couple")}
      totalSteps={TOTAL_STEPS}
      eyebrow="Step 1 — Who are you?"
      title="Tell us your names."
      subtitle="They'll show on your wedding home and budget."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => navigate("/")}>
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
          id="name1"
          label="Partner 1"
          autoComplete="given-name"
          value={name1}
          onChange={(e) => setName1(e.target.value)}
          placeholder="e.g. Maya"
        />
        <Field
          id="name2"
          label="Partner 2"
          autoComplete="given-name"
          value={name2}
          onChange={(e) => setName2(e.target.value)}
          placeholder="e.g. Yotam"
        />
      </div>
    </WizardLayout>
  );
}

export default StepCouple;
