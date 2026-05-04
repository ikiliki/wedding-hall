import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Vendor, VendorCategory } from "@wedding-hall/shared";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { LogoutButton } from "@/shared/components/LogoutButton";
import {
  deleteAdminVendor,
  fetchAdminCategories,
  fetchAdminVendors,
} from "@/shared/lib/api";
import * as styles from "./VendorListPage.styles";

function VendorListContent() {
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [cats, vends] = await Promise.all([
        fetchAdminCategories(),
        fetchAdminVendors({ includeInactive }),
      ]);
      setCategories(cats);
      setVendors(vends);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בטעינה");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [includeInactive]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string, name: string) {
    if (!confirm(`להשבית את הספק "${name}"?`)) return;
    try {
      await deleteAdminVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "שגיאה בהשבתה");
    }
  }

  const displayed =
    activeCat === "all"
      ? vendors
      : vendors.filter((v) => v.category_id === activeCat);

  return (
    <main className={styles.root}>
      <header className={styles.topbar}>
        <div>
          <Link to="/admin" className="wh-link-muted" style={{ marginInlineEnd: "1rem" }}>
            ← ניהול
          </Link>
          <h1 className={styles.heading}>ספקים</h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.8rem", display: "flex", gap: "0.35rem", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            הצג מושבתים
          </label>
          <Link to="/admin/vendors/new" className={styles.addBtn}>
            + ספק חדש
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* Category filter pills */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${activeCat === "all" ? styles.filterBtnActive : ""}`}
          onClick={() => setActiveCat("all")}
        >
          הכל
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`${styles.filterBtn} ${activeCat === c.id ? styles.filterBtnActive : ""}`}
            onClick={() => setActiveCat(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading && <p className={styles.statusMsg}>טוען…</p>}
      {error && <p className={styles.statusMsg} style={{ color: "red" }}>{error}</p>}

      {!loading && !error && displayed.length === 0 && (
        <div className={styles.emptyState}>
          <p>אין ספקים בקטגוריה זו עדיין.</p>
          <Link to="/admin/vendors/new" className={styles.addBtn}>
            + הוסף ספק ראשון
          </Link>
        </div>
      )}

      <ul className={styles.list}>
        {displayed.map((v) => (
          <li key={v.id} className={styles.card}>
            {v.photo_url ? (
              <img className={styles.cardPhoto} src={v.photo_url} alt={v.name} />
            ) : (
              <div className={`${styles.cardPhoto} ${styles.cardPhotoPlaceholder}`} aria-hidden />
            )}
            <div className={styles.cardBody}>
              <p className={styles.cardName}>{v.name}</p>
              <div className={styles.cardMeta}>
                {v.category && (
                  <span className={styles.cardBadge}>{v.category.name}</span>
                )}
                {v.city && <span>{v.city}</span>}
                {v.price_range && <span>{v.price_range}</span>}
                {v.phone && <span>{v.phone}</span>}
                {!v.is_active && (
                  <span className={styles.cardBadge} style={{ opacity: 0.5 }}>
                    מושבת
                  </span>
                )}
              </div>
              {v.description && (
                <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBlockStart: "0.25rem" }}>
                  {v.description.slice(0, 120)}{v.description.length > 120 ? "…" : ""}
                </p>
              )}
            </div>
            <div className={styles.cardActions}>
              <Link to={`/admin/vendors/${v.id}/edit`} className={styles.editBtn}>
                עריכה
              </Link>
              <button
                className={styles.deleteBtn}
                onClick={() => void handleDelete(v.id, v.name)}
              >
                השבת
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function VendorListPage() {
  return (
    <AdminGate>
      <VendorListContent />
    </AdminGate>
  );
}

export default VendorListPage;
