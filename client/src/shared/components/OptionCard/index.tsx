import * as styles from "./OptionCard.styles";

type Props = {
  label: string;
  hint?: string;
  priceLabel?: string;
  selected: boolean;
  onSelect: () => void;
  // multi = checkbox semantics, single = radio semantics
  selectionStyle?: "single" | "multi";
  /** Stitch-style tall pill card with centered icon (tier picks). */
  variant?: "default" | "bento";
  /** Material Symbols ligature, e.g. `savings`. */
  icon?: string;
  /** Icon circle palette token for bento cards. */
  iconTone?: "sage" | "honey" | "blue" | "muted";
  recommended?: boolean;
  recommendedBadge?: string;
};

export function OptionCard({
  label,
  hint,
  priceLabel,
  selected,
  onSelect,
  selectionStyle = "single",
  variant = "default",
  icon,
  iconTone = "sage",
  recommended = false,
  recommendedBadge = "מומלץ",
}: Props) {
  const role = selectionStyle === "multi" ? "checkbox" : "radio";
  const cls = [
    styles.root,
    selected ? styles.rootSelected : "",
    variant === "bento" ? "wh-opt-bento" : "",
    recommended ? "wh-opt-bento--recommended" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (variant === "bento") {
    return (
      <button
        type="button"
        role={role}
        aria-checked={selected}
        className={cls}
        onClick={onSelect}
      >
        {recommended ? (
          <span className="wh-opt-bento-ribbon">{recommendedBadge}</span>
        ) : null}
        {icon ? (
          <span
            className={`wh-opt-bento-icon-wrap wh-opt-bento-icon-wrap--${iconTone}`}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {icon}
            </span>
          </span>
        ) : null}
        <span className="wh-opt-bento-main-col">
          <span className={`${styles.label} wh-opt-bento-title`}>{label}</span>
          {priceLabel ? (
            <span
              className={[
                styles.price,
                "wh-opt-bento-price",
                selected ? styles.priceSelected : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {priceLabel}
            </span>
          ) : null}
          {hint ? (
            <span className={`${styles.hint} wh-opt-bento-hint`}>{hint}</span>
          ) : null}
        </span>
        <span className="wh-opt-bento-tail" aria-hidden>
          <span className="material-symbols-outlined wh-opt-bento-tail-ico">
            check
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      className={cls}
      onClick={onSelect}
    >
      <div className={styles.main}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
      <div className={styles.right}>
        {priceLabel && (
          <span
            className={[
              styles.price,
              selected ? styles.priceSelected : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {priceLabel}
          </span>
        )}
        <span
          className={[
            styles.checkbox,
            selected ? styles.checkboxOn : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden
        >
          {selected ? "✓" : ""}
        </span>
      </div>
    </button>
  );
}

export default OptionCard;
