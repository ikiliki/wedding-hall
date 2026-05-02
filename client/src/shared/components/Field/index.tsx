import { type InputHTMLAttributes, type ReactNode } from "react";
import * as styles from "./Field.styles";

// `id` and `size` clash with the native HTML attributes — `size` is `number`
// natively, and we want a layout token here. Omit both so our types win.
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "size"> & {
  id: string;
  label?: string;
  helper?: ReactNode;
  size?: "md" | "lg";
};

export function Field({
  id,
  label,
  helper,
  size = "lg",
  className,
  ...rest
}: Props) {
  const inputCls = size === "lg" ? styles.input : styles.inputSm;
  return (
    <div className={styles.wrap}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={[inputCls, className ?? ""].filter(Boolean).join(" ")}
        {...rest}
      />
      {helper && <p className={styles.helper}>{helper}</p>}
    </div>
  );
}

export default Field;
