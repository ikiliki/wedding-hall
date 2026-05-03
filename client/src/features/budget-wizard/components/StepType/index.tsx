import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { OptionCard } from "@/shared/components/OptionCard";
import { WizardLayout } from "@/shared/components/WizardLayout";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { TOTAL_STEPS, stepNumber, urlFor } from "@/features/budget-wizard/state/steps";
import { WizardChoiceRow } from "@/features/budget-wizard/components/WizardChoiceRow";

const TYPES = [
  {
    id: "hall" as const,
    label: "אולם אירועים",
    hint: "פנים, מיזוג, הפקה מלאה וקלאסי",
  },
  {
    id: "outdoor" as const,
    label: "גן חיצוני",
    hint: "גינות, חופים, טבע ומרחבים פתוחים",
  },
  {
    id: "unique" as const,
    label: "מיקום ייחודי",
    hint: "מדבר, חוף, חווה, יקב ומרחבים מיוחדים",
  },
];

export function StepType() {
  const navigate = useNavigate();
  const { state, setSubtype } = useWizard();

  function pickAndContinue(id: "hall" | "outdoor" | "unique") {
    setSubtype(id);
    if (id === "hall") {
      navigate(urlFor("venue"));
      return;
    }
    // Outdoor / Unique flows are stubs in Phase 1 — fall through into the
    // hall flow with a note. The user can still complete a budget; we'll
    // tailor follow-ups in a later phase.
    navigate(urlFor("venue"));
  }

  return (
    <WizardLayout
      currentStepId="type"
      stepNumber={stepNumber("type")}
      totalSteps={TOTAL_STEPS}
      title="איזה סוג חתונה?"
      subtitle="לכל סגנון יש מסלול תכנון קצת שונה. כרגע מתמקדים באולמות; גן ומיקום ייחודי יתווספו בהמשך."
      footer={
        <>
          <div className="wh-wizard-stitch-footer-actions">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => pickAndContinue(state.weddingTypeKind)}
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
            onClick={() => navigate(urlFor("guests"))}
          >
            <span className="material-symbols-outlined" aria-hidden>
              arrow_forward
            </span>
            חזור
          </button>
        </>
      }
    >
      <WizardChoiceRow variant="triple" legend="סוג חתונה">
        {TYPES.map((t) => (
          <OptionCard
            key={t.id}
            label={t.label}
            hint={t.hint}
            selected={state.weddingTypeKind === t.id}
            onSelect={() => pickAndContinue(t.id)}
          />
        ))}
      </WizardChoiceRow>
    </WizardLayout>
  );
}

export default StepType;
