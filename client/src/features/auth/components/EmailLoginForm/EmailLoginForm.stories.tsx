import type { Meta, StoryObj } from "@storybook/react";
import { EmailLoginForm } from "./index";

const meta = {
  title: "Features/Auth/EmailLoginForm",
  component: EmailLoginForm,
  tags: ["autodocs"],
  parameters: { router: { initialEntries: ["/login"] } },
} satisfies Meta<typeof EmailLoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignInSurface: Story = {
  parameters: {},
  render: () => (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <div className="wh-login-form-card">
        <EmailLoginForm variant="default" />
      </div>
    </div>
  ),
};

export const AdminGateSurface: Story = {
  parameters: {},
  render: () => (
    <div style={{ padding: "2rem", minHeight: "100vh" }}>
      <div className="wh-login-form-card">
        <EmailLoginForm variant="admin" />
      </div>
    </div>
  ),
};
