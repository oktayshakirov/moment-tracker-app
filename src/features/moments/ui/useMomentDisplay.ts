import { useEffect, useState } from "react";
import type { Moment } from "../domain/moment";
import {
  formatMomentPrimaryDisplay,
  formatMomentUnitLabel,
  formatSinceUntilLabel,
  getTickerIntervalMs,
} from "../domain/momentFormatters";
import { splitLeadingNumber } from "../domain/splitLeadingNumber";

export type MomentDisplay = {
  mainValue: string;
  subValue: string;
  sinceUntil: string;
};

/** Live-ticking display values shared across card / list / grid views. */
export function useMomentDisplay(moment: Moment): MomentDisplay {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const ms = getTickerIntervalMs(moment.displayUnit, moment);
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [moment]);

  const primary = formatMomentPrimaryDisplay(moment, now, "compact");
  const unitLabel = formatMomentUnitLabel(moment);
  const sinceUntil = formatSinceUntilLabel(moment, now);
  const isAuto = moment.displayUnit === "auto";
  const split = splitLeadingNumber(primary);
  const mainValue = split.leading || primary;
  const subValue = isAuto
    ? split.trailing
    : [split.trailing, unitLabel].filter(Boolean).join(" ");

  return { mainValue, subValue, sinceUntil };
}
