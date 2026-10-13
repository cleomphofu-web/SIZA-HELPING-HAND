/**
 * Note: This interface may be incomplete.
 * Unresolved spread operators: borderRadiusControl, defaultEvents
 * These may contain additional properties from external modules.
 */
export interface VideoJsVideoProps {
  /**
   * Source — pass as `srcType` not `source`.
   * Options: "URL" | "Upload"
   */
  srcType?: 'URL' | 'Upload';
  /**
   * URL — pass as `srcUrl` not `url`.
   * @default "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"
   */
  srcUrl?: string;
  /**
   * File — pass as `srcFile` not `file`.
   */
  srcFile?: string;
  /**
   * Loop
   */
  loop?: boolean;
  /**
   * Poster — pass as `posterEnabled` not `poster`.
   * @default true
   */
  posterEnabled?: boolean;
  /**
   * Image — pass as `poster` not `image`.
   */
  poster?: string;
  /**
   * Controls
   * @default false
   */
  controls?: boolean;
  /**
   * Muted
   */
  muted?: boolean;
  /**
   * Fit — pass as `objectFit` not `fit`.
   */
  objectFit?: string;
  /**
   * Playing
   */
  playing?: boolean;
  /**
   * Background — pass as `backgroundColor` not `background`.
   * @default "rgba(0,0,0,0)"
   */
  backgroundColor?: string;
  /**
   * Start Time
   * Range: min: 0, max: 100, step: 0.1
   */
  startTime?: number;
  /**
   * Range: min: 0, max: 100
   * @default 25
   */
  volume?: number;
  onEnd?: () => void;
  onSeeked?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  /** Additional properties */
  [key: string]: unknown;
}

import type { ComponentType } from 'react';
declare const Component: ComponentType<VideoJsVideoProps>;
export default Component;
export const Video: ComponentType<VideoJsVideoProps>;

