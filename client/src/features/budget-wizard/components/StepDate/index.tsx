import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { OptionCard } from "@/shared/components/OptionCard";
import { WizardLayout } from "@/shared/components/WizardLayout";
import type { PreferredDay } from "@wedding-hall/shared";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { TOTAL_STEPS, stepNumber, urlFor } from "@/features/budget-wizard/state/steps";

const OPTIONS: ReadonlyArray<{
  id: PreferredDay;
  label: string;
  hint: string;
}> = [
  { id: "sun_tue", label: "Sunday – Tuesday", hint: "Best price" },
  { id: "wed", label: "Wednesday", hint: "+5%" },
  { id: "thu", label: "Thursday", hint: "+15%" },
  { id: "fri_short", label: "Friday — short wedding", hint: "Daytime" },
  { id: "fri_full", label: "Friday — full wedding", hint: "Higher demand" },
];

export function StepDate() {
  const navigate = useNavigate();
  const { state, setDay } = useWizard();
  const valid = state.preferredDay !== "";

  function chooseAndNext(day: PreferredDay) {
    setDay(day);
  }

  return (
    <WizardLayout
      stepNumber={stepNumber("date")}
      totalSteps={TOTAL_STEPS}
      eyebrow="Step 2 — Wedding day"
      title="Which day, roughly?"
      subtitle="Don't worry about the exact date yet — just the day of the week."
      info="Pricing tip — Sunday to Tuesday is cheapest. Wednesday is about +5%, Thursday +15%. Friday venues sometimes offer a shorter daytime option for a better price."
      infoTitle="Why does the day matter?"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => navigate(urlFor("couple"))}>
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => navigate(urlFor("guests"))}
            disabled={!valid}
          >
            Continue
          </Button>
        </>
      }
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt.id}
          label={opt.label}
          hint={opt.hint}
          selected={state.preferredDay === opt.id}
          onSelect={() => chooseAndNext(opt.id)}
        />
      ))}
    </WizardLayout>
  );
}

export default StepDate;
