import { useEffect, useRef, useState } from "react";
import * as styles from "./InfoIcon.styles";

type Props = {
  title?: string;
  children: React.ReactNode;
  ariaLabel?: string;
};

export function InfoIcon({ title = "Worth knowing", children, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onAway(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onAway);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={ariaLabel ?? title}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        i
      </button>
      {open && (
        <div role="dialog" className={styles.popover}>
          <p className={styles.popoverTitle}>{title}</p>
          <div>{children}</div>
        </div>
      )}
    </div>
  );
}

export default InfoIcon;
