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
      currentStepId="couple"
      stepNumber={stepNumber("couple")}
      totalSteps={TOTAL_STEPS}
      title="איך קוראים לכם?"
      subtitle="השמות יופיעו בדף הבית ובתקציב."
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
            onClick={() => navigate("/")}
          >
            <span className="material-symbols-outlined" aria-hidden>
              arrow_forward
            </span>
            חזור
          </button>
        </>
      }
    >
      <div className="wh-form-grid-2">
        <Field
          id="name1"
          label="בן/בת זוג 1"
          autoComplete="given-name"
          value={name1}
          onChange={(e) => setName1(e.target.value)}
          placeholder="למשל נועה"
        />
        <Field
          id="name2"
          label="בן/בת זוג 2"
          autoComplete="off"
          value={name2}
          onChange={(e) => setName2(e.target.value)}
          placeholder="למשל גיא"
        />
      </div>
    </WizardLayout>
  );
}

export default StepCouple;
