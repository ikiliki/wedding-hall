import type { Meta, StoryObj } from "@storybook/react";
import type { Vendor, VendorCategory } from "@wedding-hall/shared";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { STORYBOOK_SERVER_ORIGIN } from "@/storybook/msw/handlers";
import { VendorListPage } from "./VendorListPage";

const mockCategories: VendorCategory[] = [
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

const mockVendors: Vendor[] = [
  {
    id: "vendor-dj-1",
    category_id: "cat-dj",
    name: "DJ Sunset",
    phone: "050-1111111",
    website_url: "https://example.com/dj-sunset",
    photo_url: null,
    description: "מוזיקה חיה ואנרגטית לאורך הערב.",
    city: "תל אביב",
    price_range: "₪₪",
    is_active: true,
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    category: mockCategories[0],
  },
  {
    id: "vendor-photo-1",
    category_id: "cat-photo",
    name: "Flash Studio",
    phone: "050-2222222",
    website_url: "https://example.com/flash-studio",
    photo_url: "https://picsum.photos/seed/vendor-photo/240/160",
    description: "צילום סטילס ווידאו, כולל אלבום דיגיטלי.",
    city: "חיפה",
    price_range: "₪₪₪",
    is_active: true,
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    category: mockCategories[1],
  },
];

const meta = {
  title: "Pages/Admin/VendorListPage",
  component: VendorListPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    auth: "loggedIn",
    router: { initialEntries: ["/admin/vendors"] },
  },
  render: () => (
    <Routes>
      <Route path="/admin/vendors" element={<VendorListPage />} />
    </Routes>
  ),
} satisfies Meta<typeof VendorListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseHandlers = [
  http.post(`${STORYBOOK_SERVER_ORIGIN}/api/profiles`, () =>
    HttpResponse.json({
      profile: {
        id: "admin-user",
        email: "admin@example.com",
        full_name: "Admin User",
        is_admin: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    }),
  ),
  http.get(`${STORYBOOK_SERVER_ORIGIN}/api/admin/categories`, () =>
    HttpResponse.json({ categories: mockCategories }),
  ),
];

export const Loaded: Story = {
  parameters: {
    msw: {
      handlers: [
        ...baseHandlers,
        http.get(`${STORYBOOK_SERVER_ORIGIN}/api/admin/vendors`, () =>
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
        ...baseHandlers,
        http.get(`${STORYBOOK_SERVER_ORIGIN}/api/admin/vendors`, () =>
          HttpResponse.json({ vendors: [] }),
        ),
      ],
    },
  },
};
