/** Lightweight list of moments for widget pickers (Phase 2) and debugging. */
export type WidgetCatalogEntry = {
  id: string;
  title: string;
  backgroundColor: string;
  /** ISO date; lets the iOS medium widget order moments by upcoming-ness. */
  targetDateTime: string;
  mode: "since" | "until";
};

export type WidgetBindingsMap = Record<string, string>;
