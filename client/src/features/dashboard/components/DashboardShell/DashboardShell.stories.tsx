import type { Meta, StoryObj } from "@storybook/react";
import { BudgetSummary } from "@/features/dashboard/components/BudgetSummary";
import { MOCK_WEDDING_BUDGET } from "@/storybook/fixtures/mock-budget";
import { DashboardShell } from "./index";

const meta = {
  title: "Features/Dashboard/DashboardShell",
  component: DashboardShell,
  tags: ["autodocs"],
  parameters: { auth: "loggedIn", router: { initialEntries: ["/dashboard"] } },
} satisfies Meta<typeof DashboardShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullDemo: Story = {
  render: () => (
    <DashboardShell>
      <BudgetSummary budget={MOCK_WEDDING_BUDGET} />
    </DashboardShell>
  ),
};

export const LoadingPlaceholder: Story = {
  name: "מצב טעינה / ריק בגוף",
  render: () => (
    <DashboardShell>
      <p className="wh-dash-hint-muted" style={{ margin: 0, textAlign: "right" }}>
        דמו: כאן מוצגים מצבי טעינה או טקסט שגיאה לפני שטעינת החשבון הושלמה.
      </p>
    </DashboardShell>
  ),
};

export const MobileChrome: Story = {
  name: "נייד — כותרת ותפריט",
  parameters: {
    viewport: {
      defaultViewport: "mobile2",
    },
  },
  render: () => (
    <DashboardShell>
      <BudgetSummary budget={MOCK_WEDDING_BUDGET} />
    </DashboardShell>
  ),
};
