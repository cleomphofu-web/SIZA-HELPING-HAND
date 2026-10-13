export interface FAQTabProps {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Variant 1" → bf1a0cKvC
   *   "Variant 2" → lPv5OKSsV
   *   "Variant 3" → MwadYNtTK
   *   "Variant 4" → tj9dnPh5B
   *   "Variant 5" → UD0B2Nz7x
   *   "Variant 6" → DTTjykEMF
   */
  variant?: 'Variant 1' | 'Variant 2' | 'Variant 3' | 'Variant 4' | 'Variant 5' | 'Variant 6' | 'bf1a0cKvC' | 'lPv5OKSsV' | 'MwadYNtTK' | 'tj9dnPh5B' | 'UD0B2Nz7x' | 'DTTjykEMF';
  /** Additional properties */
  [key: string]: unknown;
}

import type { ComponentType } from 'react';
declare const Component: ComponentType<FAQTabProps>;
export default Component;

