import type { Meta, StoryObj } from "@storybook/react";
import { LogoutButton } from "./index";

const meta = {
  title: "Common/LogoutButton",
  component: LogoutButton,
  tags: ["autodocs"],
  parameters: {
    router: { initialEntries: ["/dashboard"] },
    auth: "loggedIn",
  },
} satisfies Meta<typeof LogoutButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RedirectAfterLogout: Story = {
  args: {
    redirectAfterLogout: "/login",
  },
};
