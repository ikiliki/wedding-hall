// Generic renderer that draws any `CategoryDef` from the shared catalog
// as a wizard step. Handles all 4 templates (tier / yes_no / multi_select /
// multi_tier) plus the optional "skip" path.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { Field } from "@/shared/components/Field";
import { OptionCard } from "@/shared/components/OptionCard";
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

type Props = {
  stepId: WizardStepId;
  category: CategoryDef;
};

function priceLabel(opt: TierOption, guestCount: number): string | undefined {
  if (opt.skip) return "₪0";
  if (opt.custom) return "Your price";
  if (typeof opt.pricePerGuest === "number") {
    return `${formatILS(opt.pricePerGuest * guestCount)} total`;
  }
  if (typeof opt.flatPrice === "number") {
    return formatILS(opt.flatPrice);
  }
  return undefined;
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
    body = (
      <>
        {category.tiers.map((opt) => {
          const selected =
            current?.kind === "tier"
              ? current.optionId === opt.id
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
              onSelect={() => chooseTier(opt)}
            />
          );
        })}
        {current?.kind === "tier" &&
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
      </>
    );
  } else if (category.template === "yes_no" && category.tiers) {
    body = (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <>
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
      </>
    );
  } else if (category.template === "multi_tier" && category.groups) {
    body = (
      <>
        {category.groups.map((group) => (
          <section key={group.id} className="mt-2 first:mt-0">
            <h3 className="mb-3 text-[10px] uppercase tracking-luxe text-muted">
              {group.label}
            </h3>
            <div className="flex flex-col gap-3">
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
      <Button
        type="button"
        variant="ghost"
        onClick={handleBack}
        size="md"
      >
        Back
      </Button>
      <div className="flex items-center gap-3">
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
            Clear
          </Button>
        )}
        {category.skippable && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleSkip}
            size="md"
          >
            Skip
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          disabled={!canAdvance}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </>
  );

  return (
    <WizardLayout
      stepNumber={stepNumber(stepId)}
      totalSteps={TOTAL_STEPS}
      eyebrow={`Step ${stepNumber(stepId)} — ${category.title}`}
      title={category.title}
      subtitle={category.subtitle}
      info={category.info}
      footer={footer}
      showSummary
      runningTotal={total}
      summaryLines={totalLines}
    >
      {body}
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
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field
        id="custom-price"
        label={perGuest ? "Price per guest (₪)" : "Total price (₪)"}
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
          label="Venue name (optional)"
          type="text"
          value={label ?? ""}
          onChange={(e) => onLabel(e.target.value)}
        />
      )}
    </div>
  );
}

export default CategoryStep;
