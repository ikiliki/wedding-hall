import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogoutButton } from "@/shared/components/LogoutButton";
import * as styles from "./DashboardShell.styles";

type Props = { children: ReactNode };

const NAV = [
  { to: "/dashboard", label: "Home" },
  { to: "/budget", label: "Budget" },
  { to: "/dashboard/vendors", label: "Vendors" },
  { to: "/dashboard/purchase", label: "Purchase" },
  { to: "/dashboard/site", label: "Website" },
];

export function DashboardShell({ children }: Props) {
  return (
    <main className={styles.root}>
      <div className={styles.spotlight} aria-hidden />
      <div className={styles.inner}>
        <div className={styles.topbar}>
          <Link to="/" className={styles.brand}>
            Wedding Hall
          </Link>
          <nav className={styles.navRow} aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  [styles.navLink, isActive ? styles.navLinkActive : ""]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <LogoutButton />
        </div>
        {children}
      </div>
    </main>
  );
}

export default DashboardShell;
