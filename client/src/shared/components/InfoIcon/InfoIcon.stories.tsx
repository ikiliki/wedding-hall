import type { Meta, StoryObj } from "@storybook/react";
import { InfoIcon } from "./index";

const meta = {
  title: "Common/InfoIcon",
  component: InfoIcon,
  tags: ["autodocs"],
} satisfies Meta<typeof InfoIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PopoverExample: Story = {
  render: () => (
    <div style={{ padding: "6rem", position: "relative" }}>
      <InfoIcon title="קוד לבוש">
        נעלי הליכה נוחות — מפגש חיצוני לפני השקיעה ואחר כך ריקודים באולם.
      </InfoIcon>
    </div>
  ),
};
