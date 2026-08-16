import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listDiensten,
  verifyAdminPassword,
  createDienst,
  updateDienst,
  deleteDienst,
  uploadCsv,
  exportJson,
  type Dienst,
} from "@/lib/diensten.functions";
import { formatDate } from "@/lib/diensten-utils";

const ADMIN_KEY = "rkvenray_admin_pw";

function emptyDienst(): Omit<Dienst, "id"> {
  return {
    datum: "",
    aanwezig_tijd: "09:15",
    dienst_tijd: "09:30",
    titel: "",
    misdienaars: [],
    toelichting: "",
  };
}

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const list = useServerFn(listDiensten);
  const create = useServerFn(createDienst);
  const update = useServerFn(updateDienst);
  const del = useServerFn(deleteDienst);
  const upload = useServerFn(uploadCsv);
  const exp = useServerFn(exportJson);

  const [password, setPassword] = useState<string>("");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ADMIN_KEY);
      if (saved) setPassword(saved);
    } catch {}
  }, []);

  const { data: diensten = [] } = useQuery({
    queryKey: ["diensten"],
    queryFn: () => list(),
  });

  const [editing, setEditing] = useState<Dienst | null>(null);
  const [creating, setCreating] = useState<Omit<Dienst, "id"> | null>(null);
  const [uploadResult, setUploadResult] = useState<string>("");
  const [showPast, setShowPast] = useState(false);

  // Splits in aankomende en reeds geweest
  const todayStr = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);
  const upcoming = useMemo(() => diensten.filter((d) => d.datum >= todayStr), [diensten, todayStr]);
  const past = useMemo(() => diensten.filter((d) => d.datum < todayStr), [diensten, todayStr]);

  function logout() {
    try {
      sessionStorage.removeItem(ADMIN_KEY);
    } catch {}
    onClose();
  }

  async function handleSave(dienst: Omit<Dienst, "id">, id?: string) {
    try {
      if (id) {
        await update({ data: { password, id, dienst } });
        toast.success("Dienst opgeslagen");
      } else {
        await create({ data: { password, dienst } });
        toast.success("Dienst toegevoegd");
      }
      setEditing(null);
      setCreating(null);
      qc.invalidateQueries({ queryKey: ["diensten"] });
    } catch (e: any) {
      toast.error(e.message ?? "Opslaan mislukt");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deze dienst verwijderen?")) return;
    try {
      await del({ data: { password, id } });
      toast.success("Verwijderd");
      qc.invalidateQueries({ queryKey: ["diensten"] });
    } catch (e: any) {
      toast.error(e.message ?? "Verwijderen mislukt");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const res = await upload({ data: { password, csv: text } });
      setUploadResult(
        `✓ ${res.added} nieuwe dienst(en) toegevoegd; ${res.skipped} reeds aanwezig overgeslagen (totaal ${res.total} regels).`,
      );
      toast.success(`${res.added} toegevoegd`);
      qc.invalidateQueries({ queryKey: ["diensten"] });
    } catch (err: any) {
      setUploadResult("");
      toast.error(err.message ?? "Upload mislukt");
    } finally {
      e.target.value = "";
    }
  }

  async function handleExport() {
    try {
      const data = await exp({ data: { password } });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `misdienaars-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message ?? "Export mislukt");
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-serif text-primary text-lg flex items-center gap-2">
            Beheer dienlijst
            <span className="bg-primary text-white text-[0.68rem] px-1.5 py-0.5 rounded-sm uppercase">
              Admin
            </span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm border border-border bg-card hover:bg-muted rounded-sm"
            >
              Export JSON
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm border border-border bg-card hover:bg-muted rounded-sm"
            >
              Uitloggen
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Wijzigingen worden centraal opgeslagen en direct zichtbaar voor alle gebruikers.
          CSV-formaat (puntkomma-gescheiden): <code>Titel;Datum(DD-MM-JJJJ);Aanwezig;Tijd;Misdienaars</code>.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => setCreating(emptyDienst())}
            className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-sm text-sm font-semibold"
          >
            + Nieuwe dienst
          </button>
          <label className="text-sm">
            <span className="block text-xs text-muted-foreground mb-1">CSV uploaden:</span>
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFile}
              className="text-xs"
            />
          </label>
        </div>
        {uploadResult && (
          <div className="mt-2 text-xs text-primary-dark">{uploadResult}</div>
        )}
      </div>

      <div className="bg-card border border-border p-5 sm:p-6">
        <h2 className="font-serif text-primary text-lg border-b border-border pb-2 mb-3">
          Komende diensten ({upcoming.length})
        </h2>
        {upcoming.length > 0 ? (
          <DienstTable rows={upcoming} onEdit={setEditing} onDelete={handleDelete} />
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            Geen komende diensten.
          </p>
        )}

        {past.length > 0 && (
          <div className="mt-4">
            {!showPast ? (
              <button
                onClick={() => setShowPast(true)}
                className="w-full text-center text-sm py-3 bg-muted border border-border text-primary hover:bg-primary-bg transition-colors rounded-sm"
              >
                ▼ Toon reeds geweest diensten ({past.length})
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowPast(false)}
                  className="w-full text-center text-sm py-3 bg-muted border border-border text-primary hover:bg-primary-bg transition-colors rounded-sm mb-3"
                >
                  ▲ Verberg reeds geweest diensten
                </button>
                <h3 className="font-serif text-primary text-base border-b border-border pb-2 mb-3">
                  Reeds geweest ({past.length})
                </h3>
                <DienstTable rows={past} onEdit={setEditing} onDelete={handleDelete} />
              </>
            )}
          </div>
        )}
      </div>

      {(editing || creating) && (
        <EditModal
          initial={editing ?? creating!}
          onCancel={() => {
            setEditing(null);
            setCreating(null);
          }}
          onSave={(d) => handleSave(d, editing?.id)}
        />
      )}
    </div>
  );
}

function EditModal({
  initial,
  onCancel,
  onSave,
}: {
  initial: Omit<Dienst, "id"> | Dienst;
  onCancel: () => void;
  onSave: (d: Omit<Dienst, "id">) => void;
}) {
  const [datum, setDatum] = useState(initial.datum);
  const [aanwezig, setAanwezig] = useState(initial.aanwezig_tijd);
  const [tijd, setTijd] = useState(initial.dienst_tijd);
  const [titel, setTitel] = useState(initial.titel);
  const [misdienaars, setMisdienaars] = useState(initial.misdienaars.join(", "));
  const [toelichting, setToelichting] = useState(initial.toelichting);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!datum || !aanwezig || !tijd) {
      toast.error("Datum en tijden zijn verplicht");
      return;
    }
    onSave({
      datum,
      aanwezig_tijd: aanwezig,
      dienst_tijd: tijd,
      titel: titel.trim(),
      misdienaars: misdienaars
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      toelichting: toelichting.trim(),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-card border border-border max-w-md w-full p-5 sm:p-6 rounded-sm max-h-[90vh] overflow-y-auto"
      >
        <h3 className="font-serif text-primary text-lg border-b border-border pb-2 mb-3">
          {"id" in initial ? "Dienst bewerken" : "Nieuwe dienst"}
        </h3>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Datum *</span>
            <input
              type="date"
              required
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="w-full border border-input bg-card px-2 py-1.5 rounded-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1">Aanwezig *</span>
              <input
                type="time"
                required
                value={aanwezig}
                onChange={(e) => setAanwezig(e.target.value)}
                className="w-full border border-input bg-card px-2 py-1.5 rounded-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1">Dienst begint *</span>
              <input
                type="time"
                required
                value={tijd}
                onChange={(e) => setTijd(e.target.value)}
                className="w-full border border-input bg-card px-2 py-1.5 rounded-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">
              Titel (alleen bij bijzondere dienst)
            </span>
            <input
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="bv. Palmpasen"
              className="w-full border border-input bg-card px-2 py-1.5 rounded-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">
              Misdienaars (komma-gescheiden)
            </span>
            <input
              type="text"
              value={misdienaars}
              onChange={(e) => setMisdienaars(e.target.value)}
              placeholder="Harm, RickF"
              className="w-full border border-input bg-card px-2 py-1.5 rounded-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Toelichting</span>
            <textarea
              value={toelichting}
              onChange={(e) => setToelichting(e.target.value)}
              rows={2}
              className="w-full border border-input bg-card px-2 py-1.5 rounded-sm resize-none"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm border border-border bg-card hover:bg-muted rounded-sm"
          >
            Annuleren
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-sm bg-primary text-white hover:bg-primary-dark rounded-sm font-semibold"
          >
            Opslaan
          </button>
        </div>
      </form>
    </div>
  );
}

export function LoginModal({
  onLogin,
  onCancel,
}: {
  onLogin: (pw: string) => void;
  onCancel: () => void;
}) {
  const verify = useServerFn(verifyAdminPassword);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await verify({ data: { password: pw } });
      try {
        sessionStorage.setItem(ADMIN_KEY, pw);
      } catch {}
      onLogin(pw);
    } catch (e: any) {
      setErr(e.message ?? "Onjuist wachtwoord");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-card border border-border max-w-sm w-full p-5 sm:p-6 rounded-sm"
      >
        <h3 className="font-serif text-primary text-lg border-b border-border pb-2 mb-3">
          Beheer inloggen
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Voer het beheerderwachtwoord in om diensten toe te voegen of te wijzigen.
        </p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Wachtwoord"
          className="w-full border border-input bg-card px-2 py-2 rounded-sm text-sm mb-2"
        />
        {err && <p className="text-destructive text-xs mb-2">{err}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm border border-border bg-card hover:bg-muted rounded-sm"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={busy || !pw}
            className="px-4 py-1.5 text-sm bg-primary text-white hover:bg-primary-dark rounded-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Bezig…" : "Inloggen"}
          </button>
        </div>
      </form>
    </div>
  );
}
