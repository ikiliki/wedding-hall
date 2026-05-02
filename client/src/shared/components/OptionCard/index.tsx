import * as styles from "./OptionCard.styles";

type Props = {
  label: string;
  hint?: string;
  priceLabel?: string;
  selected: boolean;
  onSelect: () => void;
  // multi = checkbox semantics, single = radio semantics
  selectionStyle?: "single" | "multi";
};

export function OptionCard({
  label,
  hint,
  priceLabel,
  selected,
  onSelect,
  selectionStyle = "single",
}: Props) {
  const role = selectionStyle === "multi" ? "checkbox" : "radio";
  const cls = [styles.root, selected ? styles.rootSelected : ""]
    .filter(Boolean)
    .join(" ");
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
