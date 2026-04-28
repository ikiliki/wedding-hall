"use client";

import * as styles from "./StepWeddingDay.styles";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function StepWeddingDay({ value, onChange }: Props) {
  return (
    <div className={styles.field}>
      <label htmlFor="preferred-day" className={styles.label}>
        Preferred wedding day
      </label>
      <input
        id="preferred-day"
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Spring 2027, June 14, flexible"
      />
      <p className={styles.helper}>Free-form. You can refine later.</p>
    </div>
  );
}

export default StepWeddingDay;
