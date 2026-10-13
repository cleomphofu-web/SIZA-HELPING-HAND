export interface FormButtonProps {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Default" → nXDIsOETS
   *   "Disabled" → YF8bpol0o
   *   "Error" → H0JVH5F9i
   *   "Loading" → sgerqVzhp
   *   "Success" → iiyypRYoy
   */
  variant?: 'Default' | 'Disabled' | 'Error' | 'Loading' | 'Success' | 'nXDIsOETS' | 'sgerqVzhp' | 'YF8bpol0o' | 'iiyypRYoy' | 'H0JVH5F9i';
  /** Additional properties */
  [key: string]: unknown;
}

import type { ComponentType } from 'react';
declare const Component: ComponentType<FormButtonProps>;
export default Component;

