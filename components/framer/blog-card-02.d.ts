export interface BlogCardProps {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Big Card" → hkFfYuFyg
   *   "Small Card" → d8hojGVh1
   */
  variant?: 'Big Card' | 'Small Card' | 'hkFfYuFyg' | 'd8hojGVh1';
  /**
   * Image — pass as `tlE1OFuJE` not `image`.
   */
  tlE1OFuJE?: string;
  /**
   * Date — pass as `gmPYkkfdi` not `date`.
   * @default "JUN 22, 2026"
   */
  gmPYkkfdi?: string;
  ongmPYkkfdiChange?: string;
  /**
   * Title — pass as `VCOqB9hIv` not `title`.
   * @default "How to Create Functional Living Spaces Style"
   */
  VCOqB9hIv?: string;
  onVCOqB9hIvChange?: string;
  /** Additional properties */
  [key: string]: unknown;
}

import type { ComponentType } from 'react';
declare const Component: ComponentType<BlogCardProps>;
export default Component;

