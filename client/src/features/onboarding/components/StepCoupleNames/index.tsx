import * as styles from "./StepCoupleNames.styles";

type Props = {
  name1: string;
  name2: string;
  onChangeName1: (value: string) => void;
  onChangeName2: (value: string) => void;
};

export function StepCoupleNames({
  name1,
  name2,
  onChangeName1,
  onChangeName2,
}: Props) {
  return (
    <div className={styles.grid}>
      <div className={styles.field}>
        <label htmlFor="couple-name-1" className={styles.label}>
          Partner 1
        </label>
        <input
          id="couple-name-1"
          type="text"
          autoComplete="given-name"
          className={styles.input}
          value={name1}
          onChange={(e) => onChangeName1(e.target.value)}
          placeholder="First name"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="couple-name-2" className={styles.label}>
          Partner 2
        </label>
        <input
          id="couple-name-2"
          type="text"
          autoComplete="off"
          className={styles.input}
          value={name2}
          onChange={(e) => onChangeName2(e.target.value)}
          placeholder="First name"
        />
      </div>
    </div>
  );
}

export default StepCoupleNames;
