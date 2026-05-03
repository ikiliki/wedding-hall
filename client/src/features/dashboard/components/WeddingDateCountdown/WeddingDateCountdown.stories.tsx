import type { Meta, StoryObj } from "@storybook/react";
import { WeddingDateCountdown } from "./index";

const meta = {
  title: "Features/Dashboard/WeddingDateCountdown",
  component: WeddingDateCountdown,
  tags: ["autodocs"],
} satisfies Meta<typeof WeddingDateCountdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpcomingSummer: Story = {
  args: { isoDate: "2027-06-07" },
};

export const PastDate: Story = {
  args: { isoDate: "2024-03-03" },
};
