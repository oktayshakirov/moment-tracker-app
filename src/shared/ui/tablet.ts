import { useWindowDimensions } from "react-native";
import { space } from "@/shared/theme/tokens";

/** Treat a device as a tablet when its shortest side is at least this wide. */
export const TABLET_MIN_DIMENSION = 768;

/** Comfortable reading-column width that content is centered within on tablets. */
export const CONTENT_MAX_WIDTH = 700;

/** Max width for centered dialogs/sheets on tablets (phones stay full-width). */
export const SHEET_MAX_WIDTH = 560;

/** True on iPads and large Android tablets, in either orientation. */
export function useIsTablet(): boolean {
  const { width, height } = useWindowDimensions();
  return Math.min(width, height) >= TABLET_MIN_DIMENSION;
}

/**
 * Horizontal padding that centers content at {@link CONTENT_MAX_WIDTH} on
 * tablets. On phones (any non-tablet) it returns `base` unchanged, so the phone
 * layout is identical in both orientations.
 */
export function useContentPadding(base: number = space.lg): number {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= TABLET_MIN_DIMENSION;
  if (!isTablet) return base;
  return Math.max(base, (width - CONTENT_MAX_WIDTH) / 2);
}
