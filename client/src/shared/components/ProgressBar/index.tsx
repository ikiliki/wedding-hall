import * as styles from "./ProgressBar.styles";

type Props = {
  value: number; // 0..1
  label?: string;
};

export function ProgressBar({ value, label }: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  return (
    <div className={styles.wrap}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "התקדמות"}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

export default ProgressBar;
