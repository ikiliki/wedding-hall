import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./index";

const meta = {
  title: "Common/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  args: { children: "Continue" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrimaryMd: Story = {
  args: { variant: "primary", size: "md", disabled: false },
};

export const PrimaryLg: Story = {
  args: { variant: "primary", size: "lg" },
};

export const SecondaryFullWidth: Story = {
  args: { variant: "secondary", size: "md", fullWidth: true },
};

export const GhostDisabled: Story = {
  args: { variant: "ghost", size: "sm", disabled: true },
};
