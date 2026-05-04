import { useRef, useState } from "react";
import type { Vendor, VendorCategory } from "@wedding-hall/shared";
import { createClient } from "@/shared/lib/supabase";
import * as styles from "./VendorForm.styles";

type FormValues = {
  category_id: string;
  name: string;
  phone: string;
  website_url: string;
  description: string;
  city: string;
  price_range: string;
  photo_url: string;
};

type Props = {
  categories: VendorCategory[];
  initial?: Partial<Vendor>;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
};

export function VendorForm({
  categories,
  initial,
  onSubmit,
  onCancel,
  submitLabel = "שמור ספק",
}: Props) {
  const [values, setValues] = useState<FormValues>({
    category_id: initial?.category_id ?? categories[0]?.id ?? "",
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    website_url: initial?.website_url ?? "",
    description: initial?.description ?? "",
    city: initial?.city ?? "",
    price_range: initial?.price_range ?? "",
    photo_url: initial?.photo_url ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `vendors/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from("vendor-photos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("vendor-photos").getPublicUrl(data.path);
      set("photo_url", publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאת העלאה";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "שגיאה בשמירה");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Photo */}
      <div className={styles.photoSection}>
        {values.photo_url ? (
          <img
            className={styles.photoPreview}
            src={values.photo_url}
            alt="תמונת ספק"
          />
        ) : (
          <div className={styles.photoPlaceholder}>אין תמונה</div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
        <button
          type="button"
          className={styles.photoUploadBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "מעלה..." : "העלה תמונה"}
        </button>
        {uploading && <span className={styles.uploadingLabel}>מעלה לאחסון…</span>}
        {uploadError && <span className={styles.errorMsg}>{uploadError}</span>}
      </div>

      {/* URL fallback */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="vf-photo-url">
          קישור לתמונה (חלופה)
        </label>
        <input
          id="vf-photo-url"
          className={styles.input}
          type="url"
          placeholder="https://..."
          value={values.photo_url}
          onChange={(e) => set("photo_url", e.target.value)}
        />
      </div>

      <div className={styles.grid}>
        {/* Category */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="vf-category">
            קטגוריה *
          </label>
          <select
            id="vf-category"
            className={styles.select}
            value={values.category_id}
            onChange={(e) => set("category_id", e.target.value)}
            required
          >
            <option value="" disabled>
              בחר קטגוריה
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="vf-name">
            שם *
          </label>
          <input
            id="vf-name"
            className={styles.input}
            type="text"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>

        {/* Phone */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="vf-phone">
            טלפון
          </label>
          <input
            id="vf-phone"
            className={styles.input}
            type="tel"
            placeholder="050-1234567"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>

        {/* Website */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="vf-url">
            אתר אינטרנט
          </label>
          <input
            id="vf-url"
            className={styles.input}
            type="url"
            placeholder="https://..."
            value={values.website_url}
            onChange={(e) => set("website_url", e.target.value)}
          />
        </div>

        {/* City */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="vf-city">
            עיר
          </label>
          <input
            id="vf-city"
            className={styles.input}
            type="text"
            placeholder="תל אביב"
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>

        {/* Price range */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="vf-price">
            טווח מחיר
          </label>
          <select
            id="vf-price"
            className={styles.select}
            value={values.price_range}
            onChange={(e) => set("price_range", e.target.value)}
          >
            <option value="">לא צוין</option>
            <option value="₪">₪ — זול</option>
            <option value="₪₪">₪₪ — בינוני</option>
            <option value="₪₪₪">₪₪₪ — יקר</option>
            <option value="₪₪₪₪">₪₪₪₪ — יוקרתי</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="vf-desc">
          תיאור
        </label>
        <textarea
          id="vf-desc"
          className={styles.textarea}
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="פרטים על הספק, ניסיון, סגנון…"
        />
      </div>

      {submitError && <p className={styles.errorMsg}>{submitError}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={submitting}
        >
          ביטול
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={submitting || !values.name.trim() || !values.category_id}
        >
          {submitting ? "שומר…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
