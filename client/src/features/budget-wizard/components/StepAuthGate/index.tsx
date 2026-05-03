import { Link, useNavigate } from "react-router-dom";
import { WizardLayout } from "@/shared/components/WizardLayout";
import { safeWizardReturnPath } from "@/shared/lib/safe-return-path";
import {
  previousStep,
  stepNumber,
  TOTAL_STEPS,
  type WizardStepId,
  urlFor,
} from "@/features/budget-wizard/state/steps";

type Props = { intendedStepId: WizardStepId };

export function StepAuthGate({ intendedStepId }: Props) {
  const navigate = useNavigate();
  const returnPath =
    safeWizardReturnPath(urlFor(intendedStepId)) ?? urlFor(intendedStepId);
  const encoded = encodeURIComponent(returnPath);
  const prev = previousStep(intendedStepId);
  const loginHref = `/login?returnTo=${encoded}`;

  const footer = (
    <>
      <div className="wh-wizard-stitch-footer-actions">
        <Link
          to={loginHref}
          className="wh-btn-base wh-btn-lg wh-btn-primary wh-wizard-stitch-next"
        >
          התחברות או הרשמה
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
        </Link>
      </div>
      {prev ? (
        <button
          type="button"
          className="wh-wizard-stitch-back"
          onClick={() => navigate(urlFor(prev))}
        >
          <span className="material-symbols-outlined" aria-hidden>
            arrow_forward
          </span>
          חזור
        </button>
      ) : null}
    </>
  );

  return (
    <WizardLayout
      currentStepId={intendedStepId}
      stepNumber={stepNumber(intendedStepId)}
      totalSteps={TOTAL_STEPS}
      title="הגיע הזמן לשמור את ההתקדמות שלכם"
      subtitle="מהשלב הזה והלאה נדרש חשבון — כדי שנוכל לשמור את הבחירות ולהציג את האומדן אצלכם בבית ובתקציב."
      progressContext="התחברות"
      footer={footer}
      showSummary={false}
    >
      <div className="wh-wizard-auth-gate-card">
        <p className="wh-wizard-auth-gate-lead">
          כבר יש לכם חשבון? התחברו. חדשים פה? הרשמה תיקח דקה — כל מה שמילאתם עד
          כאן נשמר במכשיר שלכם ויעלה לחשבון ברגע שתסיימו להתחבר או להירשם.
        </p>
        <Link
          to={loginHref}
          className="wh-btn-base wh-btn-lg wh-btn-secondary wh-btn-wide"
        >
          המשיכו לכניסה והרשמה
        </Link>
      </div>
    </WizardLayout>
  );
}
