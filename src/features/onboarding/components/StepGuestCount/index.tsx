"use client";

import * as styles from "./StepGuestCount.styles";

type Props = {
  value: number | "";
  onChange: (value: number | "") => void;
};

export function StepGuestCount({ value, onChange }: Props) {
  return (
    <div className={styles.field}>
      <label htmlFor="guest-count" className={styles.label}>
        Approximate guest count
      </label>
      <input
        id="guest-count"
        type="number"
        inputMode="numeric"
        min={0}
        step={10}
        className={styles.input}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange("");
            return;
          }
          const parsed = Number(raw);
          onChange(Number.isFinite(parsed) ? parsed : "");
        }}
        placeholder="200"
      />
      <p className={styles.helper}>You can adjust this anytime.</p>
    </div>
  );
}

export default StepGuestCount;
