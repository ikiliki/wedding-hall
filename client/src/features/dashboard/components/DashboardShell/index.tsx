import { useRef, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogoutButton } from "@/shared/components/LogoutButton";
import { DASH_NAV_ITEMS } from "./dashboard-nav-items";
import * as styles from "./DashboardShell.styles";

type Props = { children: ReactNode };

const HERO_LOGO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80";

export function DashboardShell({ children }: Props) {
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);

  function closeMobileMenu() {
    mobileMenuRef.current?.removeAttribute("open");
  }

  return (
    <main className={styles.root}>
      <div className={styles.spotlight} aria-hidden />

      <aside className={styles.sidebar} aria-label="ניווט לוח בקרה">
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarLogoWrap}>
            <img src={HERO_LOGO} alt="" width={80} height={80} loading="lazy" />
          </div>
          <p className={styles.sidebarHeading}>Wedding Hall</p>
          <p className={styles.sidebarTagline}>התקציב שלכם בידיים טובות</p>
        </div>

        <nav className={styles.sidebarNav} aria-label="ניווט ראשי">
          {DASH_NAV_ITEMS.map((item) =>
            item.comingSoon ? (
              <span
                key={item.to}
                className={`${styles.sidebarNavLink} wh-dash-sidebar-nav-link--muted`}
                aria-disabled
                title={`${item.label} — ${item.comingSoon}`}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) =>
                  [
                    styles.sidebarNavLink,
                    isActive ? styles.sidebarNavLinkActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="material-symbols-outlined"
                      aria-hidden
                      style={
                        isActive
                          ? ({ fontVariationSettings: "'FILL' 1" } as const)
                          : undefined
                      }
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ),
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link className={styles.sidebarExpenseBtn} to="/budget">
            <span className="material-symbols-outlined" aria-hidden>
              add
            </span>
            הוסף הוצאה חדשה
          </Link>
          <span className={`${styles.sidebarBottomLink} wh-dash-sidebar-bottom-placeholder`}>
            <span className="material-symbols-outlined" aria-hidden>
              settings
            </span>
            הגדרות
          </span>
          <LogoutButton />
        </div>
      </aside>

      <header className={styles.mobileBar}>
        <Link to="/dashboard" className={styles.mobileBarTitle}>
          Wedding Hall
        </Link>
        <div className={styles.mobileBarActions}>
          <span className="material-symbols-outlined" aria-hidden>
            notifications
          </span>
          <details ref={mobileMenuRef} className={styles.mobileMenu}>
            <summary className={styles.mobileMenuSummary} aria-label="תפריט">
              <span className="material-symbols-outlined" aria-hidden>
                menu
              </span>
            </summary>
            <div className={styles.mobileMenuPanel} role="presentation">
              {DASH_NAV_ITEMS.map((item) =>
                item.comingSoon ? (
                  <span
                    key={item.to}
                    className={styles.mobileMenuSoon}
                    aria-disabled
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      {item.icon}
                    </span>
                    {item.label}{" "}
                    <span className="wh-dash-mobile-soon-lab">בקרוב</span>
                  </span>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end ?? false}
                    className={styles.mobileMenuLink}
                    onClick={closeMobileMenu}
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      {item.icon}
                    </span>
                    {item.label}
                  </NavLink>
                ),
              )}
            </div>
          </details>
        </div>
      </header>

      <div className={styles.canvas}>
        <div className={styles.canvasInner}>{children}</div>
      </div>

      <footer className={styles.pageFooter}>
        <div className={styles.pageFooterInner}>
          <p className={styles.pageFooterCopy} dir="ltr">
            © {new Date().getFullYear()} Wedding Hall. כל הזכויות שמורות.
          </p>
          <nav
            className={styles.pageFooterLinks}
            aria-label="מידע משפטי"
          >
            <a href="#">תנאי שימוש</a>
            <a href="#">מדיניות פרטיות</a>
            <a href="#">צור קשר</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

export default DashboardShell;
