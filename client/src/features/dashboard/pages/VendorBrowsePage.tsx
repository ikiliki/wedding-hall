import { useEffect, useState } from "react";
import type { Vendor } from "@wedding-hall/shared";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { ApiError, fetchPublicVendors } from "@/shared/lib/api";
import * as styles from "./VendorBrowsePage.styles";

export function VendorBrowsePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchPublicVendors();
        if (!cancelled) {
          setVendors(list);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError && err.kind === "unauthorized"
            ? "נדרשת התחברות."
            : err instanceof Error
              ? err.message
              : "לא ניתן לטעון ספקים.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell>
      <div className={styles.root}>
        <h1 className={styles.heading}>ספקים</h1>
        {loading && (
          <p style={{ margin: 0, textAlign: "right", color: "var(--stl-outline)" }}>
            טוען…
          </p>
        )}
        {error && (
          <p role="alert" style={{ margin: 0, textAlign: "right", color: "rgb(186 26 26)" }}>
            {error}
          </p>
        )}
        {!loading && !error && vendors.length === 0 && (
          <p style={{ margin: 0, textAlign: "right" }}>אין ספקים להצגה כרגע.</p>
        )}
        {!loading && !error && vendors.length > 0 && (
          <ul className={styles.list}>
            {vendors.map((v) => (
              <li key={v.id} className={styles.card}>
                <strong>{v.name}</strong>
                <div className={styles.meta}>
                  {v.category?.name ? (
                    <span>{v.category.name}</span>
                  ) : null}
                  {v.city ? <span>{v.city}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}

export default VendorBrowsePage;
