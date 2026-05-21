import type { BackgroundValue } from "./moment";

export function getBackgroundAccent(
  value: BackgroundValue,
  fallback: string,
): string {
  if (value.kind === "solid") return value.color;
  if (value.kind === "gradient")
    return value.colors[value.colors.length - 1] ?? fallback;
  return fallback;
}
