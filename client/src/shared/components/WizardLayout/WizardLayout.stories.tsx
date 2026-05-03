import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/shared/components/Button";
import { WizardSessionProvider } from "@/features/budget-wizard/state/wizard-session-context";
import { WizardLayout } from "./index";

const meta = {
  title: "Common/WizardLayout",
  component: WizardLayout,
  tags: ["autodocs"],
  parameters: {
    auth: "loggedIn",
    router: { initialEntries: ["/start/date"] },
  },
  decorators: [
    (Story) => (
      <WizardSessionProvider>
        <Story />
      </WizardSessionProvider>
    ),
  ],
} satisfies Meta<typeof WizardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SampleStep: Story = {
  render: () => (
    <WizardLayout
      stepNumber={4}
      totalSteps={21}
      currentStepId="date"
      title="תצוגה מקדימה ב‑Storybook."
      subtitle="אומדן רץ ומעטפת Stitch אמיתית (כולל פס התקדמות); הניווט דרך MemoryRouter."
      info="הסיפורים לא מתחברים ל‑Supabase — MSW מדמה את ‎`/api/budget` ו‑`/api/profiles`."
      infoTitle="איך עובדים המוקים"
      footer={
        <>
          <div className="wh-wizard-stitch-footer-actions">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="wh-wizard-stitch-next"
            >
              המשך
              <span className="material-symbols-outlined" aria-hidden>
                arrow_back
              </span>
            </Button>
          </div>
          <button type="button" className="wh-wizard-stitch-back">
            <span className="material-symbols-outlined" aria-hidden>
              arrow_forward
            </span>
            חזור
          </button>
        </>
      }
      showSummary
      runningTotal={128_750}
      summaryLines={[
        { label: "אולם", amount: 55_000 },
        { label: "שדרוג תפריט", amount: 3_750 },
      ]}
    >
      <p className="wh-field-helper">
        גוף האשף — בשלבים של התכונה זה יוחלף ב‑CategoryStep וכדומה.
      </p>
    </WizardLayout>
  ),
};
