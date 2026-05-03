import type { Meta, StoryObj } from "@storybook/react";
import { MOCK_WEDDING_BUDGET } from "@/storybook/fixtures/mock-budget";
import { BudgetSummary } from "./index";

const meta = {
  title: "Features/Dashboard/BudgetSummary",
  component: BudgetSummary,
  tags: ["autodocs"],
  parameters: { auth: "loggedIn", router: { initialEntries: ["/dashboard"] } },
} satisfies Meta<typeof BudgetSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCountdown: Story = {
  render: () => <BudgetSummary budget={MOCK_WEDDING_BUDGET} />,
};
