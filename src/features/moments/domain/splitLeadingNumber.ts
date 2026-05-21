/** Split a formatted duration into a leading number and trailing unit text. */
export function splitLeadingNumber(value: string): {
  leading: string;
  trailing: string;
} {
  const m = value.trim().match(/^([−-]?\d[\d,]*)\s*(.*)$/);
  if (!m) return { leading: "", trailing: value.trim() };
  return { leading: m[1] ?? "", trailing: m[2] ?? "" };
}
