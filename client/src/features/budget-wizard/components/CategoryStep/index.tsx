// Generic renderer that draws any `CategoryDef` from the shared catalog
// as a wizard step. Handles all 4 templates (tier / yes_no / multi_select /
// multi_tier) plus the optional "skip" path.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { Field } from "@/shared/components/Field";
import { OptionCard } from "@/shared/components/OptionCard";
import * as optionStyles from "@/shared/components/OptionCard/OptionCard.styles";
import { WizardLayout } from "@/shared/components/WizardLayout";
import {
  formatILS,
  type CategoryDef,
  type CategorySelection,
  type TierOption,
} from "@wedding-hall/shared";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import {
  TOTAL_STEPS,
  nextStep,
  previousStep,
  stepNumber,
  urlFor,
  type WizardStepId,
} from "@/features/budget-wizard/state/steps";
import {
  choicesLayoutFromCount,
  wizardOptLayoutClass,
} from "@/features/budget-wizard/lib/wizard-option-layout";
import { WizardChoiceRow } from "@/features/budget-wizard/components/WizardChoiceRow";

type Props = {
  stepId: WizardStepId;
  category: CategoryDef;
};

function priceLabel(opt: TierOption, guestCount: number): string | undefined {
  if (opt.skip) return "₪0";
  if (opt.custom) return "המחיר שלכם";
  if (typeof opt.pricePerGuest === "number") {
    return `${formatILS(opt.pricePerGuest * guestCount)} סה״כ`;
  }
  if (typeof opt.flatPrice === "number") {
    return formatILS(opt.flatPrice);
  }
  return undefined;
}

function venueTierPriceLine(opt: TierOption): string | undefined {
  if (opt.skip) return "₪0";
  if (opt.custom) return undefined;
  if (typeof opt.pricePerGuest === "number") {
    return `${formatILS(opt.pricePerGuest)} לאורח`;
  }
  if (typeof opt.flatPrice === "number") return formatILS(opt.flatPrice);
  return undefined;
}

const VENUE_STITCH_BANNER_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuArtZ0Vf7J9IPO85n-62NHWmWw5l1kGj3lyS_FxtCPaJlVH-kWXbY54lCD5yf0KkaceSZKK89UTpV7ipuv_lPrWB1SmUmFMRqEFnGiBEfTXSue-bMXizudHg25OsEuQX0iLlbCnBWmvLLmv402zJ0xHLie4gAcfvtonTg1OOeMPT-XwToP13LtJ89uTroW2jASQd1WfFgQG_BVhGNlupT-XIOdwNdwnY1t43AZF31klnbwCpymF7lRGXaoLxFQpkCwXbMOBaX62fR4";

const VENUE_TIER_STITCH_HINTS: Record<string, string> = {
  cheap: "מתאים לאירועים אינטימיים וקלאסיים בתקציב נוח",
  average: "האיזון המושלם בין איכות למחיר, הבחירה הפופולרית ביותר",
  premium: "אירוע יוקרתי עם דגש על הפרטים הקטנים ביותר",
  custom: "בחרו את התקציב המדויק שמתאים לכם",
};

const VENUE_TIER_BENTO: Record<
  string,
  {
    icon: string;
    tone: "sage" | "honey" | "blue" | "muted";
    recommended?: boolean;
  }
> = {
  cheap: { icon: "savings", tone: "sage" },
  average: { icon: "stars", tone: "honey", recommended: true },
  premium: { icon: "diamond", tone: "blue" },
  custom: { icon: "edit_note", tone: "muted" },
};

type VenueCustomTierCardProps = {
  selected: boolean;
  price: number | "";
  hint: string;
  onActivate: () => void;
  onPriceChange: (v: number | "") => void;
};

function VenueCustomTierCard({
  selected,
  price,
  hint,
  onActivate,
  onPriceChange,
}: VenueCustomTierCardProps) {
  return (
    <div
      className={[
        optionStyles.root,
        "wh-opt-bento",
        "wh-opt-bento--static",
        selected ? optionStyles.rootSelected : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label="מחיר מותאם אישית לאורח"
      onClick={() => {
        onActivate();
      }}
    >
      <div className="wh-opt-bento-icon-wrap wh-opt-bento-icon-wrap--muted">
        <span className="material-symbols-outlined" aria-hidden>
          edit_note
        </span>
      </div>
      <span className="wh-opt-bento-main-col">
        <span className={`${optionStyles.label} wh-opt-bento-title`}>
          מותאם אישית
        </span>
        <div
          className="wh-opt-bento-custom-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            id="venue-custom-price-stitch"
            className="wh-opt-bento-custom-input"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="הזן מחיר"
            aria-label="מחיר לאורח בשקלים"
            value={price === "" ? "" : String(price)}
            onChange={(e) => {
              const raw = e.target.value;
              const v = raw === "" ? "" : Math.max(0, Number(raw));
              onPriceChange(v === "" ? "" : v);
            }}
            onFocus={() => {
              onActivate();
            }}
          />
          <span className="wh-opt-bento-custom-suffix" aria-hidden>
            ₪
          </span>
        </div>
        <span className={`${optionStyles.hint} wh-opt-bento-hint`}>{hint}</span>
      </span>
      <span className="wh-opt-bento-tail" aria-hidden>
        <span className="material-symbols-outlined wh-opt-bento-tail-ico">
          check
        </span>
      </span>
    </div>
  );
}

export function CategoryStep({ stepId, category }: Props) {
  const navigate = useNavigate();
  const { state, guestMid, total, totalLines, setSelection } = useWizard();
  const current = state.selections[category.id];
  const [customPrice, setCustomPrice] = useState<number | "">(() => {
    if (current?.kind === "tier" && current.customPrice)
      return current.customPrice;
    if (current?.kind === "multi_tier" && current.customPrice)
      return current.customPrice;
    return "";
  });
  const [customLabel, setCustomLabel] = useState<string>(() => {
    if (current?.kind === "tier" && current.customLabel) return current.customLabel;
    return "";
  });

  // ----- Selection helpers (per template) ------------------------------
  function chooseTier(opt: TierOption) {
    if (opt.skip) {
      setSelection(category.id, { kind: "skip" });
      return;
    }
    const sel: CategorySelection = {
      kind: "tier",
      optionId: opt.id,
    };
    if (opt.custom) {
      sel.customPrice =
        typeof customPrice === "number" ? customPrice : undefined;
      if (customLabel.trim()) sel.customLabel = customLabel.trim();
    }
    setSelection(category.id, sel);
  }

  function chooseYesNo(opt: TierOption) {
    setSelection(category.id, {
      kind: "yes_no",
      optionId: opt.id === "yes" ? "yes" : "no",
    });
  }

  function toggleMulti(itemId: string) {
    const existing =
      current?.kind === "multi_select" ? current.itemIds : ([] as string[]);
    const next = existing.includes(itemId)
      ? existing.filter((id) => id !== itemId)
      : [...existing, itemId];
    if (next.length === 0) {
      setSelection(category.id, undefined);
    } else {
      setSelection(category.id, { kind: "multi_select", itemIds: next });
    }
  }

  function chooseMultiTier(groupId: string, opt: TierOption) {
    if (opt.skip) {
      setSelection(category.id, { kind: "skip" });
      return;
    }
    const sel: CategorySelection = {
      kind: "multi_tier",
      groupId,
      optionId: opt.id,
    };
    if (opt.custom) {
      sel.customPrice =
        typeof customPrice === "number" ? customPrice : undefined;
    }
    setSelection(category.id, sel);
  }

  function clearSelection() {
    setSelection(category.id, undefined);
  }

  // ----- Validation ----------------------------------------------------
  const canAdvance = useMemo(() => {
    if (category.skippable && current === undefined) return true; // user may skip
    if (!current) return false;
    if (current.kind === "tier") {
      const tier = category.tiers?.find((t) => t.id === current.optionId);
      if (!tier) return false;
      if (tier.custom) {
        if (typeof customPrice !== "number" || customPrice <= 0) return false;
      }
      return true;
    }
    if (current.kind === "multi_tier") {
      const group = category.groups?.find((g) => g.id === current.groupId);
      const opt = group?.options.find((o) => o.id === current.optionId);
      if (!opt) return false;
      if (opt.custom) {
        if (typeof customPrice !== "number" || customPrice <= 0) return false;
      }
      return true;
    }
    return true;
  }, [category, current, customPrice]);

  // ----- Sync the editable custom price/label back into the selection --
  function persistCustom() {
    if (!current) return;
    if (current.kind === "tier") {
      const tier = category.tiers?.find((t) => t.id === current.optionId);
      if (!tier?.custom) return;
      setSelection(category.id, {
        ...current,
        customPrice: typeof customPrice === "number" ? customPrice : undefined,
        customLabel: customLabel.trim() || undefined,
      });
    } else if (current.kind === "multi_tier") {
      const group = category.groups?.find((g) => g.id === current.groupId);
      const opt = group?.options.find((o) => o.id === current.optionId);
      if (!opt?.custom) return;
      setSelection(category.id, {
        ...current,
        customPrice: typeof customPrice === "number" ? customPrice : undefined,
      });
    }
  }

  // ----- Navigation ----------------------------------------------------
  function handleNext() {
    persistCustom();
    const n = nextStep(stepId);
    if (n) navigate(urlFor(n));
  }

  function handleBack() {
    const p = previousStep(stepId);
    navigate(p ? urlFor(p) : "/start");
  }

  function handleSkip() {
    setSelection(category.id, undefined);
    handleNext();
  }

  // ----- Body ----------------------------------------------------------
  let body: React.ReactNode = null;
  if (category.template === "tier" && category.tiers) {
    const isVenueStitch = category.id === "venue";

    const tierChoiceNodes = category.tiers.map((opt) => {
      const selected =
        current?.kind === "tier"
          ? current.optionId === opt.id
          : current?.kind === "skip" && opt.skip
            ? true
            : false;

      if (isVenueStitch && opt.custom) {
        return (
          <VenueCustomTierCard
            key={opt.id}
            selected={selected}
            price={customPrice}
            hint={VENUE_TIER_STITCH_HINTS.custom}
            onActivate={() => chooseTier(opt)}
            onPriceChange={(val) => {
              setCustomPrice(val);
              setSelection(category.id, {
                kind: "tier",
                optionId: opt.id,
                customPrice:
                  typeof val === "number" && val > 0 ? val : undefined,
                customLabel: customLabel.trim() || undefined,
              });
            }}
          />
        );
      }

      if (isVenueStitch) {
        const bento = VENUE_TIER_BENTO[opt.id] ?? {
          icon: "star",
          tone: "sage" as const,
        };
        return (
          <OptionCard
            key={opt.id}
            label={opt.label}
            hint={VENUE_TIER_STITCH_HINTS[opt.id] ?? opt.hint}
            priceLabel={venueTierPriceLine(opt)}
            selected={selected}
            onSelect={() => chooseTier(opt)}
            variant="bento"
            icon={bento.icon}
            iconTone={bento.tone}
            recommended={bento.recommended}
          />
        );
      }

      return (
        <OptionCard
          key={opt.id}
          label={opt.label}
          hint={opt.hint}
          priceLabel={priceLabel(opt, guestMid)}
          selected={selected}
          onSelect={() => chooseTier(opt)}
        />
      );
    });

    body = (
      <>
        {isVenueStitch ? (
          <>
            <WizardChoiceRow variant="bento" legend="בחירת רמת מחיר לאולם">
              {tierChoiceNodes}
            </WizardChoiceRow>
            <aside className="wh-wizard-venue-price-tip">
              <span className="material-symbols-outlined" aria-hidden>
                info
              </span>
              <p>
                מחירי המנות כוללים בדרך כלל את שכירות המקום, עיצוב בסיסי
                ושירותי מלצרות. מומלץ להוסיף כ־15% לבלת״מים.
              </p>
            </aside>
          </>
        ) : (
          <div
            className={wizardOptLayoutClass}
            data-layout={choicesLayoutFromCount(category.tiers.length)}
          >
            {tierChoiceNodes}
          </div>
        )}
        {isVenueStitch &&
          current?.kind === "tier" &&
          category.tiers.find((t) => t.id === current.optionId)?.custom && (
            <div className="wh-step-date-extra">
              <Field
                id="custom-label"
                label="שם האולם (אופציונלי)"
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onBlur={() => persistCustom()}
              />
            </div>
          )}
        {!isVenueStitch &&
          current?.kind === "tier" &&
          category.tiers.find((t) => t.id === current.optionId)?.custom && (
            <CustomPriceInputs
              showLabel={category.id === "venue"}
              price={customPrice}
              onPrice={setCustomPrice}
              label={customLabel}
              onLabel={setCustomLabel}
              perGuest={category.id === "venue"}
            />
          )}
        {isVenueStitch ? (
          <section
            className="wh-wizard-stitch-venue-banner"
            aria-label="המשך התכנון"
          >
            <img
              className="wh-wizard-stitch-venue-banner-img"
              src={VENUE_STITCH_BANNER_IMG}
              alt="אולם אירועים מעוצב"
              loading="lazy"
            />
            <div className="wh-wizard-stitch-venue-banner-caption">
              <h3>האולם החלומי שלכם מחכה</h3>
              <p>הגדירו תקציב ונתחיל בחיפוש</p>
            </div>
          </section>
        ) : null}
      </>
    );
  } else if (category.template === "yes_no" && category.tiers) {
    body = (
      <div className={wizardOptLayoutClass} data-layout="toggle">
        {category.tiers.map((opt) => {
          const selected =
            current?.kind === "yes_no" &&
            ((opt.id === "yes" && current.optionId === "yes") ||
              (opt.id === "no" && current.optionId === "no"));
          return (
            <OptionCard
              key={opt.id}
              label={opt.label}
              hint={opt.hint}
              selected={Boolean(selected)}
              onSelect={() => chooseYesNo(opt)}
            />
          );
        })}
      </div>
    );
  } else if (category.template === "multi_select" && category.items) {
    body = (
      <div
        className={wizardOptLayoutClass}
        data-layout={choicesLayoutFromCount(category.items.length)}
      >
        {category.items.map((item) => {
          const selected =
            current?.kind === "multi_select" && current.itemIds.includes(item.id);
          return (
            <OptionCard
              key={item.id}
              label={item.label}
              hint={item.hint}
              priceLabel={
                typeof item.flatPrice === "number"
                  ? formatILS(item.flatPrice)
                  : undefined
              }
              selected={Boolean(selected)}
              selectionStyle="multi"
              onSelect={() => toggleMulti(item.id)}
            />
          );
        })}
      </div>
    );
  } else if (category.template === "multi_tier" && category.groups) {
    body = (
      <>
        {category.groups.map((group) => (
          <section key={group.id} className="wh-cat-group-wrap">
            <h3 className="wh-cat-group-heading">
              {group.label}
            </h3>
            <div
              className={wizardOptLayoutClass}
              data-layout={choicesLayoutFromCount(group.options.length)}
            >
              {group.options.map((opt) => {
                const selected =
                  current?.kind === "multi_tier" &&
                  current.groupId === group.id &&
                  current.optionId === opt.id
                    ? true
                    : current?.kind === "skip" && opt.skip
                      ? true
                      : false;
                return (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    hint={opt.hint}
                    priceLabel={priceLabel(opt, guestMid)}
                    selected={selected}
                    onSelect={() => chooseMultiTier(group.id, opt)}
                  />
                );
              })}
            </div>
          </section>
        ))}
        {current?.kind === "multi_tier" &&
          category.groups
            .find((g) => g.id === current.groupId)
            ?.options.find((o) => o.id === current.optionId)?.custom && (
            <CustomPriceInputs
              price={customPrice}
              onPrice={setCustomPrice}
              perGuest={false}
            />
          )}
      </>
    );
  }

  // ----- Footer --------------------------------------------------------
  const footer = (
    <>
      <div className="wh-wizard-stitch-footer-actions">
        {category.skippable && current !== undefined && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSelection();
              setCustomPrice("");
              setCustomLabel("");
            }}
          >
            ניקוי
          </Button>
        )}
        {category.skippable && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleSkip}
            size="md"
          >
            דילוג
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          disabled={!canAdvance}
          size="lg"
          className="wh-wizard-stitch-next"
        >
          המשך
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
        </Button>
      </div>
      <button
        type="button"
        className="wh-wizard-stitch-back"
        onClick={handleBack}
      >
        <span className="material-symbols-outlined" aria-hidden>
          arrow_forward
        </span>
        חזור
      </button>
    </>
  );

  const isVenueTierStep =
    category.id === "venue" && category.template === "tier";

  return (
    <WizardLayout
      currentStepId={stepId}
      stepNumber={stepNumber(stepId)}
      totalSteps={TOTAL_STEPS}
      title={
        isVenueTierStep
          ? "איזו רמת מחיר אתם מחפשים לאולם?"
          : category.title
      }
      subtitle={
        isVenueTierStep
          ? "הבחירה שלכם תעזור לנו לדייק את הצעות המחיר והספקים שיוצגו לכם."
          : category.subtitle
      }
      info={category.info}
      footer={footer}
      showSummary
      runningTotal={total}
      summaryLines={totalLines}
    >
      <div
        className={
          isVenueTierStep ? "wh-wizard-body wh-wizard-body--stitch-tier" : undefined
        }
      >
        {body}
      </div>
    </WizardLayout>
  );
}

type CustomProps = {
  showLabel?: boolean;
  price: number | "";
  onPrice: (n: number | "") => void;
  label?: string;
  onLabel?: (s: string) => void;
  perGuest: boolean;
};

function CustomPriceInputs({
  showLabel,
  price,
  onPrice,
  label,
  onLabel,
  perGuest,
}: CustomProps) {
  return (
    <div className="wh-custom-grid">
      <Field
        id="custom-price"
        label={perGuest ? "מחיר לאורח (₪)" : "מחיר כולל (₪)"}
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        value={price === "" ? "" : String(price)}
        onChange={(e) => {
          const v = e.target.value;
          onPrice(v === "" ? "" : Math.max(0, Number(v)));
        }}
      />
      {showLabel && onLabel && (
        <Field
          id="custom-label"
          label="שם האולם (אופציונלי)"
          type="text"
          value={label ?? ""}
          onChange={(e) => onLabel(e.target.value)}
        />
      )}
    </div>
  );
}

export default CategoryStep;
