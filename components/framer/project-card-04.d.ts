export interface ProjectCardProps {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Big card" → z8Q1sgqUI
   *   "Small Card" → JHFWi4Fq0
   */
  variant?: 'Big card' | 'Small Card' | 'z8Q1sgqUI' | 'JHFWi4Fq0';
  /**
   * Location — pass as `IienP9oz0` not `location`.
   * @default "Los Angeles, USA"
   */
  IienP9oz0?: string;
  onIienP9oz0Change?: string;
  /**
   * Year — pass as `haGa7eoma` not `year`.
   * @default "( 2026)"
   */
  haGa7eoma?: string;
  onhaGa7eomaChange?: string;
  /**
   * Image — pass as `iiHNY3XXA` not `image`.
   */
  iiHNY3XXA?: string;
  /**
   * Title — pass as `dT_K6ZFq1` not `title`.
   * @default "Executive Office Workspace"
   */
  dT_K6ZFq1?: string;
  ondT_K6ZFq1Change?: string;
  /**
   * Padding — pass as `n6hjgFBgX` not `padding`.
   * @default "24px 24px 32px 24px"
   */
  n6hjgFBgX?: string;
  /** Additional properties */
  [key: string]: unknown;
}

import type { ComponentType } from 'react';
declare const Component: ComponentType<ProjectCardProps>;
export default Component;

