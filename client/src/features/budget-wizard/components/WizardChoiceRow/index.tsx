import type { ReactNode } from "react";
import * as styles from "./WizardChoiceRow.styles";

export type WizardChoiceRowVariant = "bento" | "triple";

type Props = {
  /** Visual layout: venue price tiers (4-up) or three wedding-type cards. */
  variant: WizardChoiceRowVariant;
  /** Accessible name for the radiogroup-style choices (visually hidden legend). */
  legend: string;
  children: ReactNode;
};

/**
 * Single-row (responsive) grid for mutually exclusive wizard choices.
 * Uses `fieldset` + `legend` for grouped “input” semantics.
 */
export function WizardChoiceRow({ variant, legend, children }: Props) {
  const variantClass = variant === "bento" ? styles.bento : styles.triple;
  return (
    <fieldset className={`${styles.root} ${variantClass}`}>
      <legend className={styles.legend}>{legend}</legend>
      <div className="wh-wizard-choice-row-inner">{children}</div>
    </fieldset>
  );
}

export default WizardChoiceRow;
