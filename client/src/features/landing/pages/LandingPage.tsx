import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { formatILS } from "@wedding-hall/shared";
import { Button } from "@/shared/components/Button";
import { createClient } from "@/shared/lib/supabase";
import { getPostAuthPath } from "@/shared/lib/post-auth-path";
import * as styles from "./LandingPage.styles";

const HERO_IMG =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80";

export function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      navigate(`/auth/callback?code=${encodeURIComponent(code)}`, {
        replace: true,
      });
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(Boolean(session));
    });
  }, [searchParams, navigate]);

  async function handleContinue() {
    if (!signedIn) {
      navigate("/start");
      return;
    }
    const supabase = createClient();
    const next = await getPostAuthPath(supabase);
    navigate(next);
  }

  return (
    <div className={styles.root}>
      <div className={styles.shellSpotlight} aria-hidden>
        <div className={styles.blobLg} />
        <div className={styles.blobSm} />
      </div>

      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          Wedding Hall
        </Link>
        <Link className={styles.signin} to="/login">
          {signedIn ? "החשבון שלכם" : "התחברות"}
        </Link>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroCopy}>
          <h1 className={styles.heading}>
            התקציב שלכם,
            <br />
            <span className={styles.headingAccent}>החתונה שלכם</span>
          </h1>
          <p className={styles.lede}>
            הפכו את תהליך תכנון החתונה לחוויה רגועה ומאורגנת. עם הכלים
            המקצועיים שלנו תוכלו לנהל כל שקל בביטחון ולהתרכז ברגעים החשובים.
          </p>
          <div className={styles.ctaRow}>
            <Button variant="primary" size="lg" onClick={handleContinue}>
              התחילו עכשיו
            </Button>
            <Link to="/login">
              <Button variant="secondary" size="lg" type="button">
                התחברות
              </Button>
            </Link>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.photoFrame}>
            <img className={styles.photo} alt="" src={HERO_IMG} />
          </div>
          <div className={styles.miniCard}>
            <div className={styles.miniHead}>
              <span className={styles.miniTitle}>סטטוס תקציב</span>
              <span
                className="material-symbols-outlined"
                aria-hidden
                style={{
                  fontSize: "1.375rem",
                  color: "var(--stl-primary)",
                }}
              >
                account_balance_wallet
              </span>
            </div>
            <div className={styles.miniBar}>
              <div className={styles.miniFill} />
            </div>
            <div className={styles.miniTotals}>
              <strong>{formatILS(84_500)}</strong>
              <span>מתוך {formatILS(130_000)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.featuresSection} aria-label="למה Wedding Hall">
        <div className={styles.featureGrid}>
          <article className={styles.featureCard}>
            <span className={styles.featureIconSage} aria-hidden>
              task_alt
            </span>
            <h3 className={styles.featureTitle}>תכנון בקלות</h3>
            <p className={styles.featureBody}>
              ניהול משימות חכם שמציג את מה שדחוף באמת, כדי שלא ייחסך פרט קטן
              בדרך לחופה.
            </p>
          </article>
          <article className={styles.featureCard}>
            <span className={styles.featureIconHoney} aria-hidden>
              analytics
            </span>
            <h3 className={styles.featureTitle}>מעקב תקציב</h3>
            <p className={styles.featureBody}>
              ניתוח הוצאות בזמן אמת — רואים לאן הכסף הולך ומקבלים התראות על
              חריגות צפויות.
            </p>
          </article>
          <article className={styles.featureCard}>
            <span className={styles.featureIconBlue} aria-hidden>
              verified
            </span>
            <h3 className={styles.featureTitle}>הערכות מקצועיות</h3>
            <p className={styles.featureBody}>
              הצעות מחיר על בסיס נתונים מהשוק הישראלי — כדי לנהל משא ומתן מול
              ספקים מעמדת כוח.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.banner} aria-label="קול לפעולה">
        <div className={styles.bannerBg} />
        <div className={styles.bannerShade} />
        <div className={styles.bannerBody}>
          <h2>מוכנים להתחיל לתכנן?</h2>
          <p>
            הצטרפו לאלפי זוגות שכבר מנהלים את החתונה בדרך החכמה והשקטה ביותר.
          </p>
          <Button
            className="wh-stl-banner-cta"
            variant="secondary"
            size="lg"
            type="button"
            onClick={handleContinue}
          >
            יצירת חשבון חינם
          </Button>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerRow}>
          <nav className={styles.footerLinks} aria-label="קישורים">
            <a href="#">תנאי שימוש</a>
            <a href="#">מדיניות פרטיות</a>
            <a href="#">צור קשר</a>
          </nav>
          <p className={styles.footerCopy} dir="ltr">
            © Wedding Hall · כל הזכויות שמורות
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
