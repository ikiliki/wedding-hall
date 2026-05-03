import type { Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import { WizardPage } from "./WizardPage";

const meta = {
  title: "Pages/Wizard/WizardPage",
  component: WizardPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    auth: "loggedIn",
    router: { initialEntries: ["/start/type"] },
  },
  render: () => (
    <Routes>
      <Route path="/start/*" element={<WizardPage />} />
    </Routes>
  ),
} satisfies Meta<typeof WizardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtTypeStep: Story = {};
