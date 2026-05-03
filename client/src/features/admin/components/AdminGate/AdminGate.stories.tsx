import type { Meta, StoryObj } from "@storybook/react";
import {
  handlersWithBudget,
  adminHandlers,
} from "@/storybook/msw/handlers";
import { MOCK_WEDDING_BUDGET } from "@/storybook/fixtures/mock-budget";
import { AdminGate } from "./index";

const meta = {
  title: "Features/Admin/AdminGate",
  component: AdminGate,
  tags: ["autodocs"],
  parameters: { router: { initialEntries: ["/admin"] } },
} satisfies Meta<typeof AdminGate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOutShell: Story = {
  parameters: {},
  render: () => (
    <AdminGate>
      <main className="wh-admin-inner">
        תוכן סודי — יוצג רק אחרי אימות מנהל.
      </main>
    </AdminGate>
  ),
};

export const DeniedNonAdminMock: Story = {
  parameters: {
    auth: "loggedIn",
    msw: {
      handlers: handlersWithBudget(MOCK_WEDDING_BUDGET, false),
    },
  },
  render: () => (
    <AdminGate>
      <main>לא אמורים לראות זאת כשאין הרשאת מנהל.</main>
    </AdminGate>
  ),
};

export const GrantedAdminMock: Story = {
  parameters: {
    auth: "loggedIn",
    msw: { handlers: adminHandlers() },
  },
  render: () => (
    <AdminGate>
      <main className="wh-admin-inner wh-dash-eyebrow">
        מאחורי השער — MSW מחזיר is_admin: true מ־POST /api/profiles.
      </main>
    </AdminGate>
  ),
};
