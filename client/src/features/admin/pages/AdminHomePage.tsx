import { Link } from "react-router-dom";
import { LogoutButton } from "@/shared/components/LogoutButton";
import { AdminGate } from "@/features/admin/components/AdminGate";
import * as styles from "./AdminHomePage.styles";

// Phase 1+ admin placeholder. Same Supabase project, same server, same
// client deploy — the route is gated on `profiles.is_admin`. Real admin
// features (vendors, wizard questions, cross-user views) are deferred
// until we agree on the service-role exception in RULES.md / PLAN.md.
export function AdminHomeContent() {
  return (
    <main className={styles.root}>
      <div className={styles.spotlight} aria-hidden />
      <div className={styles.inner}>
        <header className={styles.topbar}>
          <Link to="/" className={styles.brand}>
            Wedding Hall — ניהול
          </Link>
          <div className={styles.topbarRight}>
            <Link to="/dashboard" className={styles.backLink}>
              חזרה ללוח הבקרה
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className={styles.headerCard}>
          <p className={styles.headerEyebrow}>ניהול מערכת</p>
          <h1 className={styles.headerTitle}>כלי ניהול Wedding Hall</h1>
          <p className={styles.headerLede}>
            דף בית זמני לכלי ניהול. קטלוג ספקים, שאלון תקציב ודוחות בין־משתמשים
            יופיעו כאן כשנוסיף אותם בשלבים הבאים.
          </p>
        </section>

        <section className={styles.tilesGrid}>
          <Tile
            eyebrow="ספקים"
            title="קטלוג ספקים"
            body="הוספה ועריכה של ספקים שמשתמשים יוכלו לעיין בהם. בקרוב."
          />
          <Tile
            eyebrow="שאלון"
            title="שאלון התקציב"
            body="עריכת קטגוריות, רמות מחיר והנחיות שמנהלות את אשף ההצטרפות."
          />
          <Tile
            eyebrow="משתמשים"
            title="משתמשים ותקציבים"
            body="דוחות בין־משתמשים — נדחה עד שנאשר חריגת מפתח שירות (ראו RULES.md)."
          />
        </section>
      </div>
    </main>
  );
}

type TileProps = {
  eyebrow: string;
  title: string;
  body: string;
};

function Tile({ eyebrow, title, body }: TileProps) {
  return (
    <div className={styles.tile} aria-disabled="true">
      <div>
        <p className={styles.tileEyebrow}>{eyebrow}</p>
        <h2 className={styles.tileTitle}>{title}</h2>
        <p className={styles.tileBody}>{body}</p>
      </div>
      <p className={styles.tileCtaMuted}>בקרוב</p>
    </div>
  );
}

export function AdminHomePage() {
  return (
    <AdminGate>
      <AdminHomeContent />
    </AdminGate>
  );
}

export default AdminHomePage;
