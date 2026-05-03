import { useEffect, useMemo, useState } from "react";
import {
  formatCelebrationDisplay,
  isValidCelebrationDate,
} from "@/features/budget-wizard/lib/celebration-date";
import * as styles from "./WeddingDateCountdown.styles";

type Props = { isoDate: string };

function parseLocalMidnight(iso: string): number {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return NaN;
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

function useNowTick(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
}

export function WeddingDateCountdown({ isoDate }: Props) {
  const iso = isoDate.trim();
  const enabled = Boolean(iso && isValidCelebrationDate(iso));
  const now = useNowTick(enabled);

  const parsedTarget = enabled ? parseLocalMidnight(iso) : NaN;
  const tick = useMemo(() => {
    if (!Number.isFinite(parsedTarget)) return null;
    const endMs = parsedTarget + 86400000;
    const msToEnd = endMs - now;
    if (msToEnd < 0) return { ended: true as const };
    const secs = Math.floor(msToEnd / 1000);
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return { ended: false as const, days, hours, minutes, seconds };
  }, [parsedTarget, now]);

  if (!enabled) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.countdownEyebrow}>ספירה לאחור</p>
      <p className={styles.countdownDateLine}>
        <time dateTime={iso}>{formatCelebrationDisplay(iso)}</time>
      </p>
      {tick?.ended ? (
        <p className={styles.pastMessage}>הגיע היום הגדול — תיהנו מכל רגע!</p>
      ) : tick ? (
        <div className={styles.countdownGrid}>
          <div className={styles.countdownCell}>
            <div className={styles.countdownValue}>{tick.days}</div>
            <div className={styles.countdownLabel}>ימים</div>
          </div>
          <div className={styles.countdownCell}>
            <div className={styles.countdownValue}>{String(tick.hours).padStart(2, "0")}</div>
            <div className={styles.countdownLabel}>שעות</div>
          </div>
          <div className={styles.countdownCell}>
            <div className={styles.countdownValue}>{String(tick.minutes).padStart(2, "0")}</div>
            <div className={styles.countdownLabel}>דקות</div>
          </div>
          <div className={styles.countdownCell}>
            <div className={styles.countdownValue}>{String(tick.seconds).padStart(2, "0")}</div>
            <div className={styles.countdownLabel}>שניות</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default WeddingDateCountdown;
