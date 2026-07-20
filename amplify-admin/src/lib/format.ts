const RUPEES = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

/** Amounts arrive as strings — Postgres `decimal` must not round-trip a float. */
export function formatMoney(amount: string | number | null): string {
  if (amount === null) return "—";

  const value = typeof amount === "string" ? Number(amount) : amount;

  return Number.isNaN(value) ? "—" : RUPEES.format(value);
}

export function formatViews(views: number | null): string {
  if (views === null) return "—";

  return new Intl.NumberFormat("en-IN").format(views);
}

export function formatDate(value: string | null): string {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** For a datetime-local input, which wants local wall-clock, not an ISO instant. */
export function toDateTimeLocal(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;

  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function relativeDeadline(endsAt: string | null): string {
  if (!endsAt) return "no deadline";

  const deltaMs = new Date(endsAt).getTime() - Date.now();
  const days = Math.round(deltaMs / (24 * 60 * 60 * 1000));

  if (deltaMs <= 0) return "deadline passed";
  if (days === 0) return "ends today";
  if (days === 1) return "ends tomorrow";

  return `ends in ${days} days`;
}
