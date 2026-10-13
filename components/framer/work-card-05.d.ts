export interface WorkCardProps {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Blank Card" → uTZo20jK6
   *   "Card 01" → uoFBM7nKR
   *   "Card 02" → lqFJF8orC
   */
  variant?: 'Blank Card' | 'Card 01' | 'Card 02' | 'uoFBM7nKR' | 'lqFJF8orC' | 'uTZo20jK6';
  /**
   * Step — pass as `k7kFoKCRe` not `step`.
   * @default "//Step 01"
   */
  k7kFoKCRe?: string;
  onk7kFoKCReChange?: string;
  /**
   * Title — pass as `BHN2_XwgO` not `title`.
   * @default "Discovery & Consultation"
   */
  BHN2_XwgO?: string;
  onBHN2_XwgOChange?: string;
  /**
   * Text — pass as `sWf_YPZzU` not `text`.
   * @default "Understanding your vision, lifestyle, & goals to build the perfect foundation."
   */
  sWf_YPZzU?: string;
  onsWf_YPZzUChange?: string;
  /**
   * Image — pass as `CKyB_8bxK` not `image`.
   */
  CKyB_8bxK?: string;
  /**
   * Gap — pass as `mUrVwiyWd` not `gap`.
   * Range: min: 0
   * @default 144
   */
  mUrVwiyWd?: number;
  onmUrVwiyWdChange?: string;
  /**
   * Padding — pass as `cPdoPX4g2` not `padding`.
   * @default "32px"
   */
  cPdoPX4g2?: string;
  /**
   * Border — pass as `iPGXM5esZ` not `border`.
   * @default {"borderColor":"rgba(255, 255, 255, 0.10000000149011612)","borderStyle":"solid","borderWidth":1}
   */
  iPGXM5esZ?: string;
  /** Additional properties */
  [key: string]: unknown;
}

import type { ComponentType } from 'react';
declare const Component: ComponentType<WorkCardProps>;
export default Component;

