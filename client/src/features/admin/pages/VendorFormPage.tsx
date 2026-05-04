import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Vendor, VendorCategory } from "@wedding-hall/shared";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { VendorForm } from "@/features/admin/components/VendorForm";
import { LogoutButton } from "@/shared/components/LogoutButton";
import {
  createAdminVendor,
  fetchAdminCategories,
  fetchAdminVendor,
  updateAdminVendor,
} from "@/shared/lib/api";
import * as styles from "./VendorFormPage.styles";

type Mode = "create" | "edit";

type Props = { mode: Mode };

function VendorFormContent({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cats = await fetchAdminCategories();
        setCategories(cats);
        if (mode === "edit" && id) {
          const v = await fetchAdminVendor(id);
          setVendor(v);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה בטעינה");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [mode, id]);

  async function handleSubmit(values: {
    category_id: string;
    name: string;
    phone: string;
    website_url: string;
    description: string;
    city: string;
    price_range: string;
    photo_url: string;
  }) {
    const payload = {
      category_id: values.category_id,
      name: values.name,
      phone: values.phone || null,
      website_url: values.website_url || null,
      description: values.description || null,
      city: values.city || null,
      price_range: values.price_range || null,
      photo_url: values.photo_url || null,
    };

    if (mode === "create") {
      await createAdminVendor(payload);
    } else if (id) {
      await updateAdminVendor(id, payload);
    }
    navigate("/admin/vendors");
  }

  const title = mode === "create" ? "ספק חדש" : `עריכה: ${vendor?.name ?? "…"}`;

  return (
    <main className={styles.root}>
      <header className={styles.topbar}>
        <div>
          <Link to="/admin/vendors" className="wh-link-muted" style={{ marginInlineEnd: "1rem" }}>
            ← ספקים
          </Link>
          <h1 className={styles.heading}>{title}</h1>
        </div>
        <LogoutButton />
      </header>

      {loading && <p className={styles.statusMsg}>טוען…</p>}
      {error && <p className={styles.statusMsg} style={{ color: "red" }}>{error}</p>}

      {!loading && !error && categories.length > 0 && (
        <div className={styles.card}>
          <VendorForm
            categories={categories}
            initial={vendor ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/admin/vendors")}
            submitLabel={mode === "create" ? "צור ספק" : "שמור שינויים"}
          />
        </div>
      )}
    </main>
  );
}

export function VendorFormPage({ mode }: Props) {
  return (
    <AdminGate>
      <VendorFormContent mode={mode} />
    </AdminGate>
  );
}

export default VendorFormPage;
