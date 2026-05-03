import type { Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import { AuthCallbackPage } from "./AuthCallbackPage";

const meta = {
  title: "Pages/Auth/AuthCallbackPage",
  component: AuthCallbackPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    router: {
      initialEntries: ["/auth/callback?code=storybook-mock-auth-code"],
    },
  },
  render: () => (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
    </Routes>
  ),
} satisfies Meta<typeof AuthCallbackPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ExchangingMockCode: Story = {};
