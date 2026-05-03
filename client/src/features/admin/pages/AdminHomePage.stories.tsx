import type { Meta, StoryObj } from "@storybook/react";
import {
  handlersWithBudget,
  adminHandlers,
} from "@/storybook/msw/handlers";
import { MOCK_WEDDING_BUDGET } from "@/storybook/fixtures/mock-budget";
import { Route, Routes } from "react-router-dom";
import { AdminHomePage } from "./AdminHomePage";

const meta = {
  title: "Pages/Admin/AdminHomePage",
  component: AdminHomePage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    router: { initialEntries: ["/admin"] },
  },
} satisfies Meta<typeof AdminHomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeniedForRegularUser: Story = {
  parameters: {
    auth: "loggedIn",
    msw: {
      handlers: handlersWithBudget(MOCK_WEDDING_BUDGET, false),
    },
  },
  render: () => (
    <Routes>
      <Route path="/admin" element={<AdminHomePage />} />
    </Routes>
  ),
};

export const AdminWorkspace: Story = {
  parameters: {
    auth: "loggedIn",
    msw: { handlers: adminHandlers() },
  },
  render: () => (
    <Routes>
      <Route path="/admin" element={<AdminHomePage />} />
    </Routes>
  ),
};
