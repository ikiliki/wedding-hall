import type { Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";

const meta = {
  title: "Pages/Login/LoginPage",
  component: LoginPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    router: { initialEntries: ["/login"] },
  },
  render: () => (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  ),
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Form: Story = {};
