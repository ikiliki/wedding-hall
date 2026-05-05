import type { Meta, StoryObj } from "@storybook/react";
import type { VendorCategory } from "@wedding-hall/shared";
import { fn } from "@storybook/test";
import { VendorForm } from "./index";

const categories: VendorCategory[] = [
  {
    id: "cat-dj",
    name: "DJ",
    slug: "dj",
    wizard_step_key: "music",
    display_order: 10,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat-photo",
    name: "צילום",
    slug: "photo",
    wizard_step_key: "photography",
    display_order: 20,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

const meta = {
  title: "Features/Admin/VendorForm",
  component: VendorForm,
  tags: ["autodocs"],
  args: {
    categories,
    onCancel: fn(),
    onSubmit: fn(async () => {}),
  },
} satisfies Meta<typeof VendorForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {};

export const EditMode: Story = {
  args: {
    submitLabel: "שמור שינויים",
    initial: {
      id: "vendor-photo-1",
      category_id: "cat-photo",
      name: "Flash Studio",
      phone: "050-2222222",
      website_url: "https://example.com/flash-studio",
      photo_url: "https://picsum.photos/seed/vendor-photo/240/160",
      description: "צילום סטילס ווידאו לכל שלבי האירוע.",
      city: "חיפה",
      price_range: "₪₪₪",
      is_active: true,
      created_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  },
};
