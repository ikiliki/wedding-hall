import type { HTMLAttributes } from "react";
import * as styles from "./Card.styles";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
};

export function Card({
  interactive,
  selected,
  disabled,
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [
    styles.card,
    interactive ? styles.interactive : "",
    selected ? styles.selected : "",
    disabled ? styles.disabled : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-disabled={disabled || undefined} {...rest}>
      {children}
    </div>
  );
}

export default Card;
