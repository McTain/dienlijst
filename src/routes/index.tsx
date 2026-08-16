import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ServiceList } from "@/components/ServiceList";
import { AdminPanel, LoginModal } from "@/components/AdminPanel";
import { listDiensten } from "@/lib/diensten.functions";

const SRV_KEY = "rkvenray_misdienaar";
const ADMIN_KEY = "rkvenray_admin_pw";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Misdienaars – RK Venray" },
      {
        name: "description",
        content:
          "Rooster van de misdienaars voor de komende vieringen in RK Venray. Filter op dienst en eigen naam.",
      },
      { property: "og:title", content: "Misdienaars – RK Venray" },
      {
        property: "og:description",
        content: "Rooster van de misdienaars voor de komende vieringen in RK Venray.",
      },
    ],
  }),
  component: Index,
});

type Filter = "all" | "ochtend" | "avond" | "feest";

function Index() {
  const { data: diensten = [], isLoading } = useQuery({
    queryKey: ["diensten"],
    queryFn: () => listDiensten(),
  });

  const [filter, setFilter] = useState<Filter>("all");
  
  const [myName, setMyName] = useState("");
  const [adminPw, setAdminPw] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(SRV_KEY);
      if (s) setMyName(s);
      const a = sessionStorage.getItem(ADMIN_KEY);
      if (a) setAdminPw(a);
    } catch {}
  }, []);

  function changeMyName(name: string) {
    setMyName(name);
    try {
      if (name) localStorage.setItem(SRV_KEY, name);
      else localStorage.removeItem(SRV_KEY);
    } catch {}
  }

  const allNames = useMemo(() => {
    const s = new Set<string>();
    for (const d of diensten) for (const n of d.misdienaars) s.add(n);
    return Array.from(s).sort();
  }, [diensten]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Alle diensten" },
    { id: "ochtend", label: "Ochtenddiensten" },
    { id: "avond", label: "Avonddiensten" },
    { id: "feest", label: "Bijzondere diensten" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-5 my-5 sm:my-6">
          {adminPw && (
            <div className="mb-5">
              <AdminPanel onClose={() => setAdminPw(null)} />
            </div>
          )}

          <div className="bg-card border border-border p-5 sm:p-7">
            <h1 className="font-serif text-primary text-2xl font-semibold border-b-2 border-primary pb-2 mb-4">
              Misdienaars – Dienlijst
            </h1>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Hieronder vind je het rooster van de misdienaars voor de komende weken.{" "}
              <em>Aanwezig om</em> is het tijdstip waarop de misdienaar aanwezig moet zijn;{" "}
              <em>Dienst begint</em> is de aanvangstijd van de viering.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border rounded-sm transition-colors ${
                    filter === f.id
                      ? "bg-primary text-white border-primary"
                      : "bg-card border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-end mb-5 pb-4 border-b border-border">
              <label className="flex-1 min-w-[180px]">
                <span className="block text-xs text-muted-foreground mb-1">
                  Alleen de diensten van...
                </span>
                <select
                  value={myName}
                  onChange={(e) => changeMyName(e.target.value)}
                  className="w-full border border-input bg-card px-2 py-1.5 rounded-sm text-sm"
                >
                  <option value="">— Toon iedereen —</option>
                  {allNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isLoading ? (
              <div className="text-center text-muted-foreground py-10 text-sm">Laden…</div>
            ) : (
              <ServiceList
                diensten={diensten}
                filter={filter}
                
                myName={myName}
              />
            )}

            <div className="text-right mt-4">
              {adminPw ? (
                <span className="text-xs text-muted-foreground">⚙ Beheer actief ✓</span>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  ⚙ Beheer
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />

      {showLogin && (
        <LoginModal
          onLogin={(pw) => {
            setAdminPw(pw);
            setShowLogin(false);
          }}
          onCancel={() => setShowLogin(false)}
        />
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}
