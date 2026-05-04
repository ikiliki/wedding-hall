/** Primary dashboard destinations — shared by top tabs (desktop) and bottom bar (mobile). */

export type DashboardNavItem = Readonly<{
  to: string;
  label: string;
  end?: boolean;
  comingSoon?: string;
  /** Material Symbols ligature name */
  icon: string;
}>;

export const DASH_NAV_ITEMS: readonly DashboardNavItem[] = [
  { to: "/dashboard", label: "בית", end: true, icon: "home" },
  { to: "/budget", label: "ניהול תקציב", icon: "account_balance_wallet" },
  { to: "/dashboard/vendors", label: "ספקים", icon: "groups" },
  {
    to: "/dashboard/purchase",
    label: "רכישות",
    comingSoon: "בקרוב",
    icon: "shopping_bag",
  },
  {
    to: "/dashboard/site",
    label: "האתר שלי",
    comingSoon: "בקרוב",
    icon: "web",
  },
];
