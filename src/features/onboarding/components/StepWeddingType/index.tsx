"use client";

import { Card } from "@/components/Card";
import type { WeddingType } from "@/lib/types";
import * as styles from "./StepWeddingType.styles";

type Tile = {
  id: WeddingType | "garden" | "beach" | "destination";
  label: string;
  enabled: boolean;
};

const TILES: Tile[] = [
  { id: "hall", label: "Hall", enabled: true },
  { id: "garden", label: "Garden", enabled: false },
  { id: "beach", label: "Beach", enabled: false },
  { id: "destination", label: "Destination", enabled: false },
];

type Props = {
  value: WeddingType;
  onChange: (value: WeddingType) => void;
};

export function StepWeddingType({ value, onChange }: Props) {
  return (
    <div className={styles.grid}>
      {TILES.map((tile) => {
        const selected = tile.enabled && tile.id === value;
        return (
          <Card
            key={tile.id}
            interactive={tile.enabled}
            disabled={!tile.enabled}
            selected={selected}
            onClick={() => {
              if (tile.enabled && tile.id === "hall") onChange("hall");
            }}
            role="button"
            tabIndex={tile.enabled ? 0 : -1}
            onKeyDown={(e) => {
              if (!tile.enabled) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (tile.id === "hall") onChange("hall");
              }
            }}
          >
            <div className={styles.tile}>
              <span className={styles.tileLabel}>{tile.label}</span>
              <span className={styles.tileSub}>
                {tile.enabled ? "Available" : "Soon"}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default StepWeddingType;
