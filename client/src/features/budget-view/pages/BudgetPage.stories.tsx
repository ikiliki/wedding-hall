import type { Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import { BudgetPage } from "./BudgetPage";

const meta = {
  title: "Pages/Budget/BudgetPage",
  component: BudgetPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    auth: "loggedIn",
    router: { initialEntries: ["/budget"] },
  },
  render: () => (
    <Routes>
      <Route path="/budget" element={<BudgetPage />} />
    </Routes>
  ),
} satisfies Meta<typeof BudgetPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LineItemsTable: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile2",
    },
  },
};
