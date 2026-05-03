import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatILS } from "@/shared/lib/venue-pricing";
import * as styles from "./WizardMiniBudgetSummary.styles";

export type WizardMiniBudgetLine = { label: string; amount: number };

type Props = {
  total: number;
  lines: WizardMiniBudgetLine[];
  /** Max category rows to show in expanded panel (default 5). */
  maxLines?: number;
};

const MOBILE_MQ = "(max-width: 899px)";
const STORAGE_KEY = "wh:wizardBudgetFabNorm.v1";
const DRAG_THRESHOLD_PX = 10;

type NormPos = { v: 1; cxn: number; bn: number };

type PixelPos = { cx: number; b: number };

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function bottomFloorPx(): number {
  const fs = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  const rem = Number.isFinite(fs) ? fs : 16;
  return rem * 9.5 + 8;
}

function clampFabPixelPos(p: PixelPos, fabRect: DOMRect): PixelPos {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const fabW = fabRect.width;
  const fabH = fabRect.height;
  const m = 10;
  const minBottom = bottomFloorPx();
  const maxBottom = Math.max(minBottom + fabH, h - fabH - m);

  let cx = p.cx;
  let b = p.b;

  const minCx = fabW / 2 + m;
  const maxCx = w - fabW / 2 - m;

  cx = clamp(cx, minCx, Math.max(minCx, maxCx));
  b = clamp(b, minBottom, Math.max(minBottom, maxBottom));

  return { cx, b };
}

function readSavedNorm(): NormPos | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as NormPos;
    if (o?.v !== 1) return null;
    if (
      typeof o.cxn !== "number" ||
      typeof o.bn !== "number" ||
      !Number.isFinite(o.cxn) ||
      !Number.isFinite(o.bn)
    ) {
      return null;
    }
    return {
      v: 1,
      cxn: clamp(o.cxn, 0.08, 0.92),
      bn: clamp(o.bn, 0.05, 0.45),
    };
  } catch {
    return null;
  }
}

function saveNorm(p: PixelPos, chipRect: DOMRect) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w < 20 || h < 20) return;
  const c = clampFabPixelPos(p, chipRect);
  const norm: NormPos = {
    v: 1,
    cxn: clamp(c.cx / w, 0.08, 0.92),
    bn: clamp(c.b / h, 0.05, 0.45),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(norm));
  } catch {
    /* ignore quota / private mode */
  }
}

function normToPixels(n: NormPos, chipRect: DOMRect): PixelPos {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const raw: PixelPos = { cx: n.cxn * w, b: n.bn * h };
  return clampFabPixelPos(raw, chipRect);
}

/**
 * Two-mode running budget summary:
 *   • Desktop (≥900px) — inline static panel beside the wizard question column
 *     (CSS hides the FAB at this breakpoint and shows the bubble inline).
 *   • Mobile (≤899px) — floating wallet above the footer, centered by default;
 *     drag to reposition; position is stored in localStorage across steps.
 */
export function WizardMiniBudgetSummary({
  total,
  lines,
  maxLines = 5,
}: Props) {
  const displayLines = useMemo(() => {
    return [...lines]
      .filter((l) => l.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, maxLines);
  }, [lines, maxLines]);

  const [expanded, setExpanded] = useState(false);
  const wrapRef = useRef<HTMLElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const suppressClickRef = useRef(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_MQ).matches,
  );

  /** Saved / committed pixel position (center-x, bottom); null = CSS default (center). */
  const [committedPos, setCommittedPos] = useState<PixelPos | null>(null);
  /** Live position while dragging (overrides committed). */
  const [dragPos, setDragPos] = useState<PixelPos | null>(null);
  const [dragging, setDragging] = useState(false);

  const dragSession = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originCx: number;
    originB: number;
    fabW: number;
    fabH: number;
  } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    if (!isMobile) return;

    let cancelled = false;
    let raf = 0;
    let sizeMisses = 0;

    const tick = () => {
      if (cancelled) return;
      const wrap = wrapRef.current;
      if (!wrap) return;

      const saved = readSavedNorm();
      if (!saved) {
        setCommittedPos(null);
        return;
      }

      const fr = wrap.getBoundingClientRect();
      if (fr.width < 8 || fr.height < 8) {
        if (sizeMisses++ > 90) return;
        raf = requestAnimationFrame(tick);
        return;
      }

      setCommittedPos(normToPixels(saved, fr));
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) return;
    const onResize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const fr = wrap.getBoundingClientRect();
      if (fr.width < 8) return;
      const saved = readSavedNorm();
      if (saved) {
        setCommittedPos(normToPixels(saved, fr));
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isMobile]);

  const displayPos = dragPos ?? committedPos;

  const floatWrapStyle =
    isMobile && displayPos !== null
      ? {
          left: `${displayPos.cx}px`,
          bottom: `${displayPos.b}px`,
          transform: "translateX(-50%)" as const,
          right: "auto",
        }
      : undefined;

  // Tap-out / Esc collapses (mobile FAB UX). Listeners only while expanded.
  useEffect(() => {
    if (!expanded) return;
    function onAway(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setExpanded(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    document.addEventListener("mousedown", onAway);
    document.addEventListener("touchstart", onAway, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onAway);
      document.removeEventListener("touchstart", onAway);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  function readOriginFromDOM(): PixelPos | null {
    const el = wrapRef.current;
    const fab = fabRef.current;
    if (!el || !fab) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return null;
    const cx = rect.left + rect.width / 2;
    const b = window.innerHeight - rect.bottom;
    return { cx, b };
  }

  function fabPointerDown(e: React.PointerEvent) {
    if (!isMobile || expanded) return;
    if (e.button !== 0) return;
    const fab = fabRef.current;
    const wrap = wrapRef.current;
    if (!fab || !wrap) return;
    const r = wrap.getBoundingClientRect();

    const origin =
      (committedPos ?? dragPos) ?? readOriginFromDOM() ?? {
        cx: window.innerWidth / 2,
        b: bottomFloorPx(),
      };

    dragSession.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originCx: origin.cx,
      originB: origin.b,
      fabW: r.width,
      fabH: r.height,
    };
    fab.setPointerCapture(e.pointerId);
  }

  function fabPointerMove(e: React.PointerEvent) {
    const s = dragSession.current;
    if (!s || s.pointerId !== e.pointerId) return;

    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;

    if (!dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      setDragging(true);
    }

    const next: PixelPos = {
      cx: s.originCx + dx,
      b: s.originB - dy,
    };
    const rect = new DOMRect(0, 0, s.fabW, s.fabH);
    setDragPos(clampFabPixelPos(next, rect));
  }

  function fabPointerUp(e: React.PointerEvent) {
    const s = dragSession.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const fab = fabRef.current;
    const wrap = wrapRef.current;
    if (fab?.hasPointerCapture(e.pointerId)) {
      fab.releasePointerCapture(e.pointerId);
    }
    dragSession.current = null;

    if (dragging && dragPos != null && wrap) {
      suppressClickRef.current = true;
      const fr = wrap.getBoundingClientRect();
      const final = clampFabPixelPos(dragPos, fr);
      setCommittedPos(final);
      saveNorm(final, fr);
      setDragPos(null);
      setDragging(false);
      return;
    }

    setDragging(false);
    setDragPos(null);
  }

  function fabPointerCancel(e: React.PointerEvent) {
    fabPointerUp(e);
  }

  function fabClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setExpanded((v) => !v);
  }

  return (
    <aside
      ref={wrapRef}
      className={styles.floatWrap}
      data-expanded={expanded ? "true" : "false"}
      data-dragging={dragging ? "true" : "false"}
      data-custom-pos={displayPos != null ? "true" : "false"}
      style={floatWrapStyle}
      aria-label="אומדן תקציב רץ"
    >
      <button
        ref={fabRef}
        type="button"
        className={styles.fab}
        aria-expanded={expanded}
        aria-controls="wh-wiz-mini-sum-bubble-content"
        aria-label={`אומדן רץ ${formatILS(total)}`}
        onClick={fabClick}
        onPointerDown={fabPointerDown}
        onPointerMove={fabPointerMove}
        onPointerUp={fabPointerUp}
        onPointerCancel={fabPointerCancel}
        style={{ touchAction: dragging ? "none" : "manipulation" }}
      >
        <span
          className={`material-symbols-outlined ${styles.fabIcon}`}
          aria-hidden
        >
          {expanded ? "close" : "account_balance_wallet"}
        </span>
        <span className={styles.fabAmount} aria-hidden>
          {formatILS(total)}
        </span>
      </button>

      <div
        id="wh-wiz-mini-sum-bubble-content"
        className={styles.bubble}
        role="region"
      >
        <div className={styles.sheet}>
          <span
            className={`material-symbols-outlined ${styles.sheetWalletIcon}`}
            aria-hidden
          >
            account_balance_wallet
          </span>
          <p className={styles.eyebrow}>אומדן רץ</p>
          <p className={styles.total}>{formatILS(total)}</p>
          <p className={styles.hint}>
            מתעדכן בכל בחירה. השרת מחשב מחדש את הסכום בעת השמירה.
          </p>
          {displayLines.length === 0 ? (
            <p className={styles.empty}>
              בחרו רמת מחיר לאולם כדי להתחיל למלא את האומדן.
            </p>
          ) : (
            <ul className={styles.lines}>
              {displayLines.map((l) => (
                <li key={l.label} className={styles.line}>
                  <span className={styles.lineLabel}>{l.label}</span>
                  <span className={styles.lineAmt}>{formatILS(l.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

export default WizardMiniBudgetSummary;
