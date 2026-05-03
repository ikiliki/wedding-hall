import type { Meta, StoryObj } from "@storybook/react";
import { OptionCard } from "./index";

const meta = {
  title: "Common/OptionCard",
  component: OptionCard,
  tags: ["autodocs"],
} satisfies Meta<typeof OptionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tier: Story = {
  args: {
    label: "חבילה ממוצעת",
    hint: "איזון בין איכות למחיר",
    priceLabel: "₪48,000 סה״כ",
    selected: false,
    selectionStyle: "single",
    onSelect: () => {},
  },
};

export const SelectedWithCheckbox: Story = {
  args: {
    label: "חבילה ממוצעת",
    hint: "איזון בין איכות למחיר",
    priceLabel: "₪48,000 סה״כ",
    selected: true,
    selectionStyle: "multi",
    onSelect: () => {},
  },
};
