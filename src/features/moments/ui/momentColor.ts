import type { Moment } from "../domain/moment";

/** A representative solid color for a moment, ignoring any image background. */
export function momentColor(moment: Moment): string {
  const v = moment.backgroundValue;
  if (v.kind === "solid") return v.color;
  if (v.kind === "gradient") return v.colors[0];
  return moment.accentColor;
}
