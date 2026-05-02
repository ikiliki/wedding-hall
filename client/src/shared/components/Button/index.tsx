import { forwardRef, type ButtonHTMLAttributes } from "react";
import * as styles from "./Button.styles";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const variantClass: Record<Variant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
};

const sizeClass: Record<Size, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", fullWidth, className, children, ...rest },
    ref,
  ) {
    const classes = [
      styles.base,
      sizeClass[size],
      variantClass[variant],
      fullWidth ? styles.block : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classes} {...rest}>
        {children}
      </button>
    );
  },
);

export default Button;
