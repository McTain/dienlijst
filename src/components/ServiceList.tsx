import { useMemo, useState } from "react";
import type { Dienst } from "@/lib/diensten.functions";
import { categorize, dayName, formatDate, MONTHS, parseDate } from "@/lib/diensten-utils";

type Props = {
  diensten: Dienst[];
  filter: "all" | "ochtend" | "avond" | "feest";
  myName: string;
};

export function ServiceList({ diensten, filter, myName }: Props) {
  const [showFuture, setShowFuture] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const cutoff = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 13);
    return d;
  }, [today]);

  const filtered = useMemo(() => {
    return diensten.filter((d) => {
      const dt = parseDate(d.datum);
      if (dt < today) return false;
      const cat = categorize(d);
      if (filter === "feest" && cat !== "feest") return false;
      if (filter === "ochtend" && cat !== "ochtend") return false;
      if (filter === "avond" && cat !== "avond") return false;
      if (myName && !d.misdienaars.includes(myName)) return false;
      return true;
    });
  }, [diensten, filter, myName, today]);

  const groups = useMemo(() => {
    const map = new Map<string, Dienst[]>();
    for (const d of filtered) {
      const dt = parseDate(d.datum);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return Array.from(map.entries()).map(([key, items]) => {
      const [y, m] = key.split("-").map(Number);
      return { key, year: y, month: m, items };
    });
  }, [filtered]);

  // Split into near (<= cutoff) and future
  const nearItems: Dienst[] = [];
  const futureItems: Dienst[] = [];
  for (const d of filtered) {
    (parseDate(d.datum) > cutoff ? futureItems : nearItems).push(d);
  }

  const visible = showFuture ? filtered : nearItems;

  if (visible.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10 text-sm">
        Geen diensten gevonden.
      </div>
    );
  }

  // Re-group visible
  const visibleGroups = new Map<string, Dienst[]>();
  for (const d of visible) {
    const dt = parseDate(d.datum);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    if (!visibleGroups.has(key)) visibleGroups.set(key, []);
    visibleGroups.get(key)!.push(d);
  }

  return (
    <div className="space-y-6">
      {Array.from(visibleGroups.entries()).map(([key, items]) => {
        const [y, m] = key.split("-").map(Number);
        return (
          <section key={key}>
            <h2 className="font-serif text-primary text-lg border-b-2 border-primary pb-1 mb-3 uppercase tracking-wide">
              {MONTHS[m]} {y}
            </h2>
            <div className="grid gap-2 md:grid-cols-2">
              {items.map((d) => (
                <DienstCard key={d.id} dienst={d} myName={myName} />
              ))}
            </div>
          </section>
        );
      })}

      {!showFuture && futureItems.length > 0 && (
        <button
          onClick={() => setShowFuture(true)}
          className="w-full text-center text-sm py-3 bg-muted border border-border text-primary hover:bg-primary-bg transition-colors rounded-sm"
        >
          ▼ Toon alle overige diensten ({futureItems.length})
        </button>
      )}
      {showFuture && futureItems.length > 0 && (
        <button
          onClick={() => setShowFuture(false)}
          className="w-full text-center text-sm py-3 bg-muted border border-border text-primary hover:bg-primary-bg transition-colors rounded-sm"
        >
          ▲ Verberg overige diensten
        </button>
      )}
    </div>
  );
}

function DienstCard({ dienst, myName }: { dienst: Dienst; myName: string }) {
  const isFeest = dienst.titel.trim() !== "";
  const hasMe = myName && dienst.misdienaars.includes(myName);

  return (
    <article
      className={`bg-card border ${
        hasMe ? "border-primary border-2" : "border-border"
      } rounded-sm overflow-hidden`}
    >
      {isFeest && (
        <div className="bg-primary text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
          {dienst.titel}
        </div>
      )}
      <div className="p-3 sm:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <div>
            <div className="font-semibold text-foreground">{formatDate(dienst.datum)}</div>
            <div className="text-xs text-muted-foreground capitalize">{dayName(dienst.datum)}</div>
          </div>
          <div className="text-right text-sm">
            <div>
              <span className="text-muted-foreground">Aanwezig </span>
              <span className="font-semibold tabular-nums">{dienst.aanwezig_tijd}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Dienst </span>
              <span className="font-semibold tabular-nums">{dienst.dienst_tijd}</span>
            </div>
          </div>
        </div>
        {dienst.misdienaars.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {dienst.misdienaars.map((n) => (
              <span
                key={n}
                className={`inline-block px-2 py-1 text-xs rounded-sm ${
                  n === myName
                    ? "bg-primary text-white font-semibold"
                    : "bg-primary-bg text-primary border border-primary/20"
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs italic text-muted-foreground mt-2">
            Geen misdienaars nodig
          </div>
        )}
        {dienst.toelichting && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {dienst.toelichting}
          </p>
        )}
      </div>
    </article>
  );
}
