import type { Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";

const meta = {
  title: "Pages/Dashboard/DashboardPage",
  component: DashboardPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    auth: "loggedIn",
    router: { initialEntries: ["/dashboard"] },
  },
  render: () => (
    <Routes>
      <Route path="/dashboard/*" element={<DashboardPage />} />
    </Routes>
  ),
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile2",
    },
  },
};
