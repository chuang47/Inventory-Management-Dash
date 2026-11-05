const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function money(n: number | null | undefined, whole = false) {
  if (n == null) return "—";
  return (whole ? usd0 : usd).format(n);
}

export function signedMoney(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n < 0 ? "−" : "+"}${usd.format(Math.abs(n))}`;
}

export function shortDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(`${d.slice(0, 10)}T00:00:00`);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}
