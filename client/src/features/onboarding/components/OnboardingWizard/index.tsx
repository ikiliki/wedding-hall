import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import type { VenuePriceType, WeddingType } from "@/shared/lib/types";
import { StepCoupleNames } from "@/features/onboarding/components/StepCoupleNames";
import { StepGuestCount } from "@/features/onboarding/components/StepGuestCount";
import { StepVenuePrice } from "@/features/onboarding/components/StepVenuePrice";
import { StepWeddingDay } from "@/features/onboarding/components/StepWeddingDay";
import { StepWeddingType } from "@/features/onboarding/components/StepWeddingType";
import { saveBudget } from "@/features/onboarding/lib/saveBudget";
import * as styles from "./OnboardingWizard.styles";

const TOTAL_STEPS = 5;

type StepHeader = { eyebrow: string; title: string };

const HEADERS: Record<number, StepHeader> = {
  0: { eyebrow: "Step 1 of 5", title: "Who's getting married?" },
  1: { eyebrow: "Step 2 of 5", title: "When, roughly?" },
  2: { eyebrow: "Step 3 of 5", title: "How many guests?" },
  3: { eyebrow: "Step 4 of 5", title: "Wedding type" },
  4: { eyebrow: "Step 5 of 5", title: "Venue tier" },
};

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [coupleName1, setCoupleName1] = useState("");
  const [coupleName2, setCoupleName2] = useState("");
  const [preferredDay, setPreferredDay] = useState("");
  const [guestCount, setGuestCount] = useState<number | "">("");
  const [weddingType] = useState<WeddingType>("hall");
  const [venuePriceType, setVenuePriceType] =
    useState<VenuePriceType>("average");
  const [customPricePerGuest, setCustomPricePerGuest] = useState<number | "">(
    "",
  );
  const [venueName, setVenueName] = useState("");

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return coupleName1.trim().length > 0 && coupleName2.trim().length > 0;
      case 1:
        return true;
      case 2:
        return typeof guestCount === "number" && guestCount > 0;
      case 3:
        return weddingType === "hall";
      case 4:
        if (venuePriceType === "custom") {
          return (
            typeof customPricePerGuest === "number" && customPricePerGuest > 0
          );
        }
        return true;
      default:
        return false;
    }
  })();

  function handleBack() {
    setErrorMessage(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function handleNext() {
    setErrorMessage(null);
    if (!canAdvance) return;
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    handleSubmit();
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        await saveBudget({
          coupleName1,
          coupleName2,
          preferredDay,
          guestCount: typeof guestCount === "number" ? guestCount : 0,
          weddingType,
          venuePriceType,
          customPricePerGuest:
            venuePriceType === "custom" &&
            typeof customPricePerGuest === "number"
              ? customPricePerGuest
              : undefined,
          venueName:
            venuePriceType === "custom" ? venueName : undefined,
        });
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      }
    });
  }

  const header = HEADERS[step];
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <main className={styles.wrapper}>
      <div className={styles.progressBar} aria-label="Progress">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className={[
              styles.progressDot,
              i <= step ? styles.progressDotActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </div>

      <p className={styles.stepTitle}>{header.eyebrow}</p>
      <h1 className={styles.stepHeading}>{header.title}</h1>

      <div className={styles.body}>
        {step === 0 && (
          <StepCoupleNames
            name1={coupleName1}
            name2={coupleName2}
            onChangeName1={setCoupleName1}
            onChangeName2={setCoupleName2}
          />
        )}
        {step === 1 && (
          <StepWeddingDay value={preferredDay} onChange={setPreferredDay} />
        )}
        {step === 2 && (
          <StepGuestCount value={guestCount} onChange={setGuestCount} />
        )}
        {step === 3 && (
          <StepWeddingType value={weddingType} onChange={() => {}} />
        )}
        {step === 4 && (
          <StepVenuePrice
            value={venuePriceType}
            onChange={setVenuePriceType}
            customPricePerGuest={customPricePerGuest}
            onChangeCustomPricePerGuest={setCustomPricePerGuest}
            venueName={venueName}
            onChangeVenueName={setVenueName}
          />
        )}
      </div>

      {errorMessage && (
        <p className="mt-6 text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      )}

      <div className={styles.footer}>
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={step === 0 || pending}
          type="button"
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!canAdvance || pending}
          type="button"
        >
          {pending ? "Saving..." : isLast ? "Save" : "Next"}
        </Button>
      </div>
    </main>
  );
}

export default OnboardingWizard;
