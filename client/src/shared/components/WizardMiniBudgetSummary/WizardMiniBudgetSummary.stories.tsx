import type { Meta, StoryObj } from "@storybook/react";
import { WizardMiniBudgetSummary } from "./index";

const meta = {
  title: "Shared/WizardMiniBudgetSummary",
  component: WizardMiniBudgetSummary,
  tags: ["autodocs"],
} satisfies Meta<typeof WizardMiniBudgetSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    total: 148_320,
    lines: [
      { label: "אולם לאירועים", amount: 88_000 },
      { label: "שדרוג תפריט", amount: 12_400 },
      { label: "בר", amount: 9_200 },
    ],
  },
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: "70vh",
          background: "rgb(255 248 243)",
          position: "relative",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const EmptyLines: Story = {
  args: {
    total: 0,
    lines: [],
  },
  decorators: Default.decorators,
};
