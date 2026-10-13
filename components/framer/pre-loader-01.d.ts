export interface PreLoaderProps {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "1" → GQGceR8k_
   *   "2" → wRnC3lab8
   *   "3" → O1stxaQ9K
   *   "4" → waVJDsq1d
   *   "5" → YK5huYsE0
   *   "6" → k35sFwlo8
   */
  variant?: '1' | '2' | '3' | '4' | '5' | '6' | 'GQGceR8k_' | 'wRnC3lab8' | 'O1stxaQ9K' | 'waVJDsq1d' | 'YK5huYsE0' | 'k35sFwlo8';
  /** Additional properties */
  [key: string]: unknown;
}

import type { ComponentType } from 'react';
declare const Component: ComponentType<PreLoaderProps>;
export default Component;

