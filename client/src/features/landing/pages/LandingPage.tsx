import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { createClient } from "@/shared/lib/supabase";
import { getPostAuthPath } from "@/shared/lib/post-auth-path";
import * as styles from "./LandingPage.styles";

export function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  // 1) If a Supabase confirmation link landed on `/?code=...`, forward.
  // 2) If the user already has a session, show "Continue" instead of "Start".
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
    <main className={styles.root}>
      <div className={styles.spotlight} aria-hidden />

      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          Wedding Hall
        </Link>
        <Link to="/login" className={styles.signin}>
          {signedIn ? "Account" : "Sign in"}
        </Link>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Welcome</p>
        <h1 className={styles.heading}>
          Build your first
          <br />
          <span className={styles.headingAccent}>wedding budget</span>
          <br />
          in minutes.
        </h1>
        <p className={styles.lede}>
          We'll walk you through it together — venue, food, music, flowers —
          one calm question at a time. So nothing gets missed, and your
          special day stays peaceful.
        </p>

        <div className={styles.ctaRow}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            aria-label="Let's start"
          >
            Let's start
          </Button>
          <Link to="/login" className={styles.secondaryCta}>
            Already have an account? Sign in
          </Link>
        </div>

        <ul className={styles.featureList} aria-label="What you get">
          <li className={styles.feature}>
            <span className={styles.featureNum}>01</span>
            <div>
              <p className={styles.featureTitle}>Step-by-step questions</p>
              <p className={styles.featureBody}>
                Pick from cheap, average, premium — or your own price.
              </p>
            </div>
          </li>
          <li className={styles.feature}>
            <span className={styles.featureNum}>02</span>
            <div>
              <p className={styles.featureTitle}>One running total</p>
              <p className={styles.featureBody}>
                Watch your estimated budget grow line by line.
              </p>
            </div>
          </li>
          <li className={styles.feature}>
            <span className={styles.featureNum}>03</span>
            <div>
              <p className={styles.featureTitle}>Your real prices, later</p>
              <p className={styles.featureBody}>
                Compare estimated vs. actual once you start booking.
              </p>
            </div>
          </li>
        </ul>
      </section>

      <footer className={styles.footer}>
        <span>© Wedding Hall</span>
        <span>Designed for desktop and mobile.</span>
      </footer>
    </main>
  );
}

export default LandingPage;
