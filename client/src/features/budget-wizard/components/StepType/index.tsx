import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { OptionCard } from "@/shared/components/OptionCard";
import { WizardLayout } from "@/shared/components/WizardLayout";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { TOTAL_STEPS, stepNumber, urlFor } from "@/features/budget-wizard/state/steps";

const TYPES = [
  {
    id: "hall" as const,
    label: "Wedding venue (hall)",
    hint: "Indoor, air-conditioned, classic, full production",
  },
  {
    id: "outdoor" as const,
    label: "Outdoor garden venue",
    hint: "Gardens, open spaces, greenery, nature reserves",
  },
  {
    id: "unique" as const,
    label: "Unique location",
    hint: "Desert, beach, farm, vineyard, open-air unique spaces",
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
      stepNumber={stepNumber("type")}
      totalSteps={TOTAL_STEPS}
      eyebrow="Step 4 — Setting"
      title="What kind of wedding?"
      subtitle="Each setting unlocks a slightly different planning path. We're starting with halls today; outdoor and unique flows arrive next."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => navigate(urlFor("guests"))}>
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => pickAndContinue(state.weddingTypeKind)}
          >
            Continue
          </Button>
        </>
      }
    >
      {TYPES.map((t) => (
        <OptionCard
          key={t.id}
          label={t.label}
          hint={t.hint}
          selected={state.weddingTypeKind === t.id}
          onSelect={() => pickAndContinue(t.id)}
        />
      ))}
    </WizardLayout>
  );
}

export default StepType;
