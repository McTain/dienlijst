import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Dienst = {
  id: string;
  datum: string; // YYYY-MM-DD
  aanwezig_tijd: string; // HH:MM
  dienst_tijd: string; // HH:MM
  titel: string;
  misdienaars: string[];
  toelichting: string;
};

const dienstInput = z.object({
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum moet YYYY-MM-DD zijn"),
  aanwezig_tijd: z.string().regex(/^\d{2}:\d{2}$/, "Tijd moet HH:MM zijn"),
  dienst_tijd: z.string().regex(/^\d{2}:\d{2}$/, "Tijd moet HH:MM zijn"),
  titel: z.string().max(200).default(""),
  misdienaars: z.array(z.string().min(1).max(60)).max(20).default([]),
  toelichting: z.string().max(2000).default(""),
});

function trimTime(t: string) {
  // Postgres returns HH:MM:SS — strip seconds
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function mapRow(row: any): Dienst {
  return {
    id: row.id,
    datum: row.datum,
    aanwezig_tijd: trimTime(row.aanwezig_tijd),
    dienst_tijd: trimTime(row.dienst_tijd),
    titel: row.titel ?? "",
    misdienaars: row.misdienaars ?? [],
    toelichting: row.toelichting ?? "",
  };
}

function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) throw new Error("Admin-wachtwoord is niet ingesteld op de server.");
  // constant-time-ish compare
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) throw new Error("Onjuist wachtwoord");
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) throw new Error("Onjuist wachtwoord");
}

export const listDiensten = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Automatisch opruimen: diensten ouder dan 3 maanden verwijderen
  const cut = new Date();
  cut.setMonth(cut.getMonth() - 3);
  const cutoff = `${cut.getFullYear()}-${String(cut.getMonth() + 1).padStart(2, "0")}-${String(cut.getDate()).padStart(2, "0")}`;
  await supabaseAdmin.from("diensten").delete().lt("datum", cutoff);

  const { data, error } = await supabaseAdmin
    .from("diensten")
    .select("*")
    .order("datum", { ascending: true })
    .order("dienst_tijd", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
});

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    return { ok: true };
  });

export const createDienst = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; dienst: z.infer<typeof dienstInput> }) =>
    z.object({ password: z.string().min(1).max(200), dienst: dienstInput }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("diensten")
      .insert(data.dienst)
      .select("*")
      .single();
    if (error) {
      if ((error as any).code === "23505") throw new Error("Er bestaat al een dienst op deze datum en tijd.");
      throw new Error(error.message);
    }
    return mapRow(row);
  });

export const updateDienst = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; dienst: z.infer<typeof dienstInput> }) =>
    z.object({ password: z.string().min(1).max(200), id: z.string().uuid(), dienst: dienstInput }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("diensten")
      .update(data.dienst)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) {
      if ((error as any).code === "23505") throw new Error("Er bestaat al een dienst op deze datum en tijd.");
      throw new Error(error.message);
    }
    return mapRow(row);
  });

export const deleteDienst = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) =>
    z.object({ password: z.string().min(1).max(200), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("diensten").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// CSV: Titel;Datum(DD-MM-YYYY);Aanwezig(HH:MM);Tijd(HH:MM);Misdienaars(comma-separated)
function parseCsv(text: string) {
  const rows: z.infer<typeof dienstInput>[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^titel/i.test(l));
  for (const line of lines) {
    const parts = line.split(";").map((p) => p.replace(/^"|"$/g, "").trim());
    if (parts.length < 5) continue;
    const [titel, datumRaw, aanwezig, tijd, serversRaw] = parts;
    const m = datumRaw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m) continue;
    const datum = `${m[3]}-${m[2]}-${m[1]}`;
    if (!/^\d{2}:\d{2}$/.test(aanwezig) || !/^\d{2}:\d{2}$/.test(tijd)) continue;
    const misdienaars = serversRaw ? serversRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    rows.push({ titel: titel || "", datum, aanwezig_tijd: aanwezig, dienst_tijd: tijd, misdienaars, toelichting: "" });
  }
  return rows;
}

export const uploadCsv = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; csv: string }) =>
    z.object({ password: z.string().min(1).max(200), csv: z.string().min(1).max(500_000) }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const parsed = parseCsv(data.csv);
    if (parsed.length === 0) return { added: 0, skipped: 0, total: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check existing keys
    const datumSet = Array.from(new Set(parsed.map((r) => r.datum)));
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("diensten")
      .select("datum, dienst_tijd")
      .in("datum", datumSet);
    if (exErr) throw new Error(exErr.message);
    const existSet = new Set((existing ?? []).map((r: any) => `${r.datum}|${trimTime(r.dienst_tijd)}`));

    const toInsert = parsed.filter((r) => !existSet.has(`${r.datum}|${r.dienst_tijd}`));
    const skipped = parsed.length - toInsert.length;
    if (toInsert.length === 0) return { added: 0, skipped, total: parsed.length };

    const { error: insErr } = await supabaseAdmin.from("diensten").insert(toInsert);
    if (insErr) throw new Error(insErr.message);
    return { added: toInsert.length, skipped, total: parsed.length };
  });

export const exportJson = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("diensten")
      .select("*")
      .order("datum", { ascending: true })
      .order("dienst_tijd", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map(mapRow);
  });
