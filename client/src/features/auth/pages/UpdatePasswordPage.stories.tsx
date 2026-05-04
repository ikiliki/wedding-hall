import type { Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import { UpdatePasswordPage } from "./UpdatePasswordPage";

const meta = {
  title: "Pages/Login/UpdatePasswordPage",
  component: UpdatePasswordPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    auth: "loggedIn",
    router: { initialEntries: ["/auth/update-password"] },
  },
  render: () => (
    <Routes>
      <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
    </Routes>
  ),
} satisfies Meta<typeof UpdatePasswordPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Form: Story = {};
