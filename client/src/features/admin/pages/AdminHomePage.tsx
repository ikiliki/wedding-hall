import { Link } from "react-router-dom";
import { LogoutButton } from "@/shared/components/LogoutButton";
import { AdminGate } from "@/features/admin/components/AdminGate";
import * as styles from "./AdminHomePage.styles";

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
            ניהול ספקים, קטגוריות ותוכן האפליקציה.
          </p>
        </section>

        <section className={styles.tilesGrid}>
          <ActiveTile
            eyebrow="ספקים"
            title="קטלוג ספקים"
            body="הוספה ועריכה של ספקים לפי קטגוריה."
            href="/admin/vendors"
            cta="פתח קטלוג"
          />
          <Tile
            eyebrow="שאלון"
            title="שאלון התקציב"
            body="עריכת קטגוריות, רמות מחיר והנחיות שמנהלות את אשף ההצטרפות."
          />
          <Tile
            eyebrow="משתמשים"
            title="משתמשים ותקציבים"
            body="דוחות בין־משתמשים — בתכנון."
          />
        </section>
      </div>
    </main>
  );
}

type ActiveTileProps = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

function ActiveTile({ eyebrow, title, body, href, cta }: ActiveTileProps) {
  return (
    <Link to={href} className={styles.tile} style={{ textDecoration: "none" }}>
      <div>
        <p className={styles.tileEyebrow}>{eyebrow}</p>
        <h2 className={styles.tileTitle}>{title}</h2>
        <p className={styles.tileBody}>{body}</p>
      </div>
      <p className={styles.tileCtaMuted}>{cta} →</p>
    </Link>
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
