import type { Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./LandingPage";

const meta = {
  title: "Pages/Landing/LandingPage",
  component: LandingPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    router: { initialEntries: ["/"] },
  },
  render: () => (
    <Routes>
      <Route path="/" element={<LandingPage />} />
    </Routes>
  ),
} satisfies Meta<typeof LandingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile2",
    },
  },
};
