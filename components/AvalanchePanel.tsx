"use client";
const dangerLabels = ["No Rating", "Low", "Moderate", "Considerable", "High", "Extreme"];
const rating = (value: any) => typeof value === "number" && value >= 1 && value <= 5 ? dangerLabels[value] + ` (${value})` : "—";
export default function AvalanchePanel({ data, loading, error }: any) {
  const bulletin = data?.bulletin, summary = data?.summary;
  const status = data?.status || "unavailable";
  const formatTime = (value: any) => {
    if (!value) return "Not supplied";
    if (!/(?:Z|[+-]\d\d:\d\d)$/.test(value)) return value.replace("T", " ") + " " + (bulletin?.timeZone || "local time");
    return new Date(value).toLocaleString("en-CA", { timeZone: bulletin?.timeZone || "America/Vancouver", timeZoneName: "short" });
  };
  return <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm" aria-label="Official avalanche bulletin">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Official avalanche bulletin</h3><a className="rounded-xl border px-3 py-2 text-sm underline" href={data?.url || "https://avalanche.ca/"} target="_blank" rel="noreferrer">Read full official bulletin</a></div>
    {loading ? <p role="status">Loading official avalanche feed…</p> : <>
      <p className="text-sm text-slate-600">Source: {data?.source || "Official feed unavailable"}{bulletin?.zone ? " · " + bulletin.zone : ""}</p>
      <div className={"rounded-xl p-4 text-sm " + (status === "available" ? "bg-slate-100 text-slate-900" : "bg-amber-50 text-amber-900")}><strong>{status === "unrated" ? "Seasonal statement · No Rating" : status === "expired" ? "Expired bulletin · excluded from scoring" : status === "available" ? "Current regional danger rating" : "No current bulletin loaded"}</strong><p className="mt-2">{error || summary?.headline || "No danger rating is assumed. Review the original bulletin."}</p></div>
      {bulletin && <><p className="text-xs text-slate-500">Issued {formatTime(bulletin.issuedAt)} · Valid until {formatTime(bulletin.validUntil)}</p><p className="text-sm text-slate-600">{bulletin.scope}</p></>}
      {data?.avalancheHistory?.length > 0 && <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[650px] text-left text-sm"><caption className="sr-only">Current bulletin forecast ratings, not a 14-day history</caption><thead className="bg-slate-100"><tr>{["Forecast date / expires", "Alpine", "Treeline", "Below treeline", "Regional maximum"].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{data.avalancheHistory.map((row: any) => <tr key={row.label} className="border-t"><td className="p-3">{formatTime(row.label)}</td><td className="p-3">{rating(row.alpine)}</td><td className="p-3">{rating(row.treeline)}</td><td className="p-3">{rating(row.belowTreeline)}</td><td className="p-3">{rating(row.rating)}</td></tr>)}</tbody></table></div>}
      {!!bulletin?.problems?.length && <p className="text-sm"><strong>Avalanche problems:</strong> {bulletin.problems.join(", ")}</p>}
      {!summary?.hasCurrentRating && <p className="text-sm font-medium text-amber-900">No numeric avalanche rating enters scoring. No Rating means unknown danger, not Low danger.</p>}
    </>}
  </section>;
}
