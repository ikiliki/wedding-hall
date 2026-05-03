import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./index";

const meta = {
  title: "Common/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  render: () => (
    <Card style={{ maxWidth: "28rem" }}>
      <p className="wh-opt-label">כרטיס מעוגל</p>
      <p className="wh-field-helper">כרטיס סטטי לניסויי פריסה.</p>
    </Card>
  ),
};

export const InteractiveSelected: Story = {
  render: () => (
    <Card interactive selected style={{ maxWidth: "28rem" }}>
      <p>מצב אינטראקטיבי + נבחר.</p>
    </Card>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Card disabled style={{ maxWidth: "28rem" }}>
      <p>סגנון מושבת / אפור.</p>
    </Card>
  ),
};
