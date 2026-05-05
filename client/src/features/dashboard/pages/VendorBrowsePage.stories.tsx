import type { Meta, StoryObj } from "@storybook/react";
import type { Vendor } from "@wedding-hall/shared";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { STORYBOOK_SERVER_ORIGIN } from "@/storybook/msw/handlers";
import { VendorBrowsePage } from "./VendorBrowsePage";

const mockVendors: Vendor[] = [
  {
    id: "vendor-dj-1",
    category_id: "cat-dj",
    name: "DJ Sunset",
    phone: "050-1111111",
    website_url: "https://example.com/dj-sunset",
    photo_url: null,
    description: "סט חתונה מודרני עם בקשות שירים בזמן אמת.",
    city: "תל אביב",
    price_range: "₪₪",
    is_active: true,
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    category: {
      id: "cat-dj",
      name: "DJ",
      slug: "dj",
      wizard_step_key: "music",
      display_order: 10,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  },
  {
    id: "vendor-photo-1",
    category_id: "cat-photo",
    name: "Flash Studio",
    phone: "050-2222222",
    website_url: "https://example.com/flash-studio",
    photo_url: null,
    description: "צוות צילום סטילס ווידאו לאירועים.",
    city: "חיפה",
    price_range: "₪₪₪",
    is_active: true,
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    category: {
      id: "cat-photo",
      name: "צילום",
      slug: "photo",
      wizard_step_key: "photography",
      display_order: 20,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  },
];

const meta = {
  title: "Pages/Dashboard/VendorBrowsePage",
  component: VendorBrowsePage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    auth: "loggedIn",
    router: { initialEntries: ["/dashboard/vendors"] },
  },
  render: () => (
    <Routes>
      <Route path="/dashboard/vendors" element={<VendorBrowsePage />} />
    </Routes>
  ),
} satisfies Meta<typeof VendorBrowsePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${STORYBOOK_SERVER_ORIGIN}/api/vendors`, () =>
          HttpResponse.json({ vendors: mockVendors }),
        ),
      ],
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${STORYBOOK_SERVER_ORIGIN}/api/vendors`, () =>
          HttpResponse.json({ vendors: [] }),
        ),
      ],
    },
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${STORYBOOK_SERVER_ORIGIN}/api/vendors`, () =>
          HttpResponse.json({ error: "failed" }, { status: 500 }),
        ),
      ],
    },
  },
};
