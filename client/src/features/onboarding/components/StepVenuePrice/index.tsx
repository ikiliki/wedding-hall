import { Card } from "@/shared/components/Card";
import type { VenuePriceType } from "@/shared/lib/types";
import { VENUE_TIERS } from "@/shared/lib/venue-pricing";
import * as styles from "./StepVenuePrice.styles";

type Props = {
  value: VenuePriceType;
  onChange: (value: VenuePriceType) => void;
  customPricePerGuest: number | "";
  onChangeCustomPricePerGuest: (value: number | "") => void;
  venueName: string;
  onChangeVenueName: (value: string) => void;
};

export function StepVenuePrice({
  value,
  onChange,
  customPricePerGuest,
  onChangeCustomPricePerGuest,
  venueName,
  onChangeVenueName,
}: Props) {
  return (
    <div>
      <div className={styles.list}>
        {VENUE_TIERS.map((tier) => {
          const selected = tier.id === value;
          return (
            <Card
              key={tier.id}
              interactive
              selected={selected}
              onClick={() => onChange(tier.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(tier.id);
                }
              }}
            >
              <div className={styles.tileBody}>
                <div>
                  <span className={styles.tileLabel}>{tier.label}</span>
                  <span className={styles.tileSub}>{tier.description}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {value === "custom" && (
        <div className={styles.customGroup}>
          <div className={styles.field}>
            <label htmlFor="custom-price" className={styles.fieldLabel}>
              Price per guest (₪)
            </label>
            <input
              id="custom-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={10}
              className={styles.input}
              value={customPricePerGuest}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onChangeCustomPricePerGuest("");
                  return;
                }
                const parsed = Number(raw);
                onChangeCustomPricePerGuest(
                  Number.isFinite(parsed) ? parsed : "",
                );
              }}
              placeholder="350"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="venue-name" className={styles.fieldLabel}>
              Venue name (optional)
            </label>
            <input
              id="venue-name"
              type="text"
              className={styles.input}
              value={venueName}
              onChange={(e) => onChangeVenueName(e.target.value)}
              placeholder="The Hall"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default StepVenuePrice;
