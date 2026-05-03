import type { Meta, StoryObj } from "@storybook/react";
import { RequireAuth } from "./RequireAuth";

const meta = {
  title: "Common/RequireAuth",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMockSession: Story = {
  parameters: { auth: "loggedIn" },
  render: () => (
    <RequireAuth>
      <article className="wh-login-form-card">
        <p>
          בלי <code>parameters.auth</code> הסיפור נטען ומפנה ל־
          <code>/login</code> ב־MemoryRouter — השתמשו בסיפור הזה כשיש סשן מחובר.
        </p>
      </article>
    </RequireAuth>
  ),
};
