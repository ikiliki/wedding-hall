import type { Meta, StoryObj } from "@storybook/react";
import { Field } from "./index";

const meta = {
  title: "Common/Field",
  component: Field,
  tags: ["autodocs"],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = {
  args: {
    id: "field-lg",
    label: "תאריך החגיגה",
    size: "lg",
    type: "date",
    defaultValue: "2026-06-02",
    helper: "בחרו תאריך אמיתי לספירה לאחור.",
  },
};

export const MediumNoLabel: Story = {
  args: {
    id: "field-md",
    size: "md",
    type: "text",
    placeholder: "הערות לאולם",
    defaultValue: "",
  },
};
