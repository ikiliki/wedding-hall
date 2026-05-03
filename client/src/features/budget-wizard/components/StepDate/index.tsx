import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { OptionCard } from "@/shared/components/OptionCard";
import { Field } from "@/shared/components/Field";
import { WizardLayout } from "@/shared/components/WizardLayout";
import type { PreferredDay } from "@wedding-hall/shared";
import {
  isValidCelebrationDate,
} from "@/features/budget-wizard/lib/celebration-date";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { TOTAL_STEPS, stepNumber, urlFor } from "@/features/budget-wizard/state/steps";
import {
  choicesLayoutFromCount,
  wizardOptLayoutClass,
} from "@/features/budget-wizard/lib/wizard-option-layout";

const OPTIONS: ReadonlyArray<{
  id: PreferredDay;
  label: string;
  hint: string;
}> = [
  { id: "sun_tue", label: "ראשון עד שלישי", hint: "מחיר נוח" },
  { id: "wed", label: "רביעי", hint: "+5%" },
  { id: "thu", label: "חמישי", hint: "+15%" },
  { id: "fri_short", label: "שישי — חתונה קצרה", hint: "שעות היום" },
  { id: "fri_full", label: "שישי — חתונה מלאה", hint: "ביקוש גבוה" },
];

export function StepDate() {
  const navigate = useNavigate();
  const { state, setDay, setCelebrationDate } = useWizard();
  const weekdayOk = state.preferredDay !== "";
  const calendarOk = isValidCelebrationDate(state.celebrationDate);
  const valid = weekdayOk && calendarOk;

  const title = weekdayOk
    ? "מתי החתונה?"
    : "באיזה יום בשבוע?";

  const subtitle = weekdayOk
    ? "בחרו תאריך אמיתי בלוח — הספירה לאחור בדף הבית מתחילה מכאן."
    : "הבחירה נותנת רמזי תמחור (ראשון–שלישי נוח, חמישי ושישי פרימיום). אחר כך תיפתח בחירת התאריך.";

  const progressContext = !weekdayOk
    ? "יום בשבוע"
    : !calendarOk
      ? "תאריך בלוח"
      : "מוכנים להמשיך";

  return (
    <WizardLayout
      currentStepId="date"
      stepNumber={stepNumber("date")}
      totalSteps={TOTAL_STEPS}
      progressContext={progressContext}
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <div className="wh-wizard-stitch-footer-actions">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => navigate(urlFor("guests"))}
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
            onClick={() => navigate(urlFor("couple"))}
          >
            <span className="material-symbols-outlined" aria-hidden>
              arrow_forward
            </span>
            חזור
          </button>
        </>
      }
    >
      <div
        className={wizardOptLayoutClass}
        data-layout={choicesLayoutFromCount(OPTIONS.length)}
      >
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            hint={opt.hint}
            selected={state.preferredDay === opt.id}
            onSelect={() => setDay(opt.id)}
          />
        ))}
      </div>

      {weekdayOk ? (
        <div className="wh-step-date-extra">
          <Field
            id="celebration-date"
            label="תאריך בלוח"
            type="date"
            size="md"
            value={state.celebrationDate}
            onChange={(e) => setCelebrationDate(e.target.value)}
            helper={
              !calendarOk ? "נדרש תאריך כדי להמשיך." : undefined
            }
          />
        </div>
      ) : null}
    </WizardLayout>
  );
}

export default StepDate;
