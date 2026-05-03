import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./index";

const meta = {
  title: "Common/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThirtyPercent: Story = {
  args: { value: 0.3, label: "3 of 10" },
};

export const Complete: Story = {
  args: { value: 1, label: "Done" },
};
