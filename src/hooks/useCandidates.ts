import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Candidate, CandidateStatus, Payment } from "@/types/candidate";
import { toast } from "sonner";

// Map a DB row + payments into the app's Candidate shape (Albanian field names).
const mapDbToCandidate = (
  row: any,
  payments: any[],
): Candidate => ({
  id: row.id,
  numriRegjistrimit: row.numri_regjistrimit ?? "",
  numriPersonal: row.numri_personal ?? "",
  emri: row.emri ?? "",
  mbiemri: row.mbiemri ?? "",
  emriBabait: row.emri_babait ?? "",
  vendlindja: row.vendlindja ?? "",
  telefon: row.telefon ?? "",
  dataLindjes: row.data_lindjes ?? "",
  kategoria: row.kategoria ?? "B",
  certifikataShendetsore: row.certifikata_shendetsore ?? "",
  vendi: row.vendi ?? "",
  statusi: (row.statusi ?? "regjistuar") as CandidateStatus,
  dataRegjistrimit: row.data_regjistrimit ?? "",
  shenimet: row.shenimet ?? "",
  shumaMarreveshjes: Number(row.shuma_marreveshjes ?? 0),
  vertetimiPrintuar: !!row.vertetimi_printuar,
  dokumenteTerhequr: !!row.dokumente_terhequr,
  instructorId: row.instructor_id ?? null,
  payments: payments
    .filter((p) => p.candidate_id === row.id)
    .map((p) => ({
      id: p.id,
      shuma: Number(p.shuma),
      data: p.data,
    })),
});

const candidateToDbInsert = (c: Candidate, tenantId: string) => ({
  id: c.id && c.id.length > 20 ? c.id : undefined, // let DB generate uuid for short ids (mock-style)
  tenant_id: tenantId,
  numri_regjistrimit: c.numriRegjistrimit,
  numri_personal: c.numriPersonal || null,
  emri: c.emri,
  mbiemri: c.mbiemri,
  emri_babait: c.emriBabait || null,
  vendlindja: c.vendlindja || null,
  telefon: c.telefon || null,
  data_lindjes: c.dataLindjes || null,
  kategoria: c.kategoria,
  certifikata_shendetsore: c.certifikataShendetsore || null,
  vendi: c.vendi || null,
  statusi: c.statusi,
  data_regjistrimit: c.dataRegjistrimit || new Date().toISOString().split("T")[0],
  shenimet: c.shenimet || null,
  shuma_marreveshjes: c.shumaMarreveshjes ?? 0,
  vertetimi_printuar: !!c.vertetimiPrintuar,
  dokumente_terhequr: !!c.dokumenteTerhequr,
});

export const useCandidates = () => {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Gabim gjatë ngarkimit të kandidatëve");
      setCandidates([]);
      setLoading(false);
      return;
    }
    const ids = (rows ?? []).map((r: any) => r.id);
    let payments: any[] = [];
    if (ids.length > 0) {
      const { data: pData } = await supabase
        .from("candidate_payments")
        .select("*")
        .in("candidate_id", ids);
      payments = pData ?? [];
    }
    setCandidates((rows ?? []).map((r: any) => mapDbToCandidate(r, payments)));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tenantLoading) return;
    refresh();
  }, [tenantLoading, tenantId, refresh]);

  const addCandidate = async (c: Candidate) => {
    if (!tenantId) {
      toast.error("Autoshkolla nuk u gjet. Ju lutem rifreskoni faqen ose hyni përsëri.");
      console.error("addCandidate: tenantId is null");
      return;
    }
    const payload = candidateToDbInsert(c, tenantId);
    delete (payload as any).id; // always let DB generate
    const { data, error } = await supabase
      .from("candidates")
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error("addCandidate error:", error);
      toast.error("Ruajtja e kandidatit dështoi: " + error.message);
      return;
    }
    setCandidates((prev) => [mapDbToCandidate(data, []), ...prev]);
  };

  const updateCandidate = async (updated: Candidate) => {
    if (!tenantId) return;
    const payload = candidateToDbInsert(updated, tenantId);
    delete (payload as any).id;
    delete (payload as any).tenant_id;
    const { error } = await supabase
      .from("candidates")
      .update(payload)
      .eq("id", updated.id);
    if (error) {
      toast.error("Përditësimi dështoi: " + error.message);
      return;
    }
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const addPayment = async (candidateId: string, payment: Payment) => {
    if (!tenantId) return;
    const { data, error } = await supabase
      .from("candidate_payments")
      .insert({
        tenant_id: tenantId,
        candidate_id: candidateId,
        shuma: payment.shuma,
        data: payment.data,
      })
      .select()
      .single();
    if (error) {
      toast.error("Pagesa dështoi: " + error.message);
      return;
    }
    const newPayment: Payment = { id: data.id, shuma: Number(data.shuma), data: data.data };
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId ? { ...c, payments: [...c.payments, newPayment] } : c,
      ),
    );
  };

  const setVertetimiPrintuar = async (candidateId: string) => {
    const { error } = await supabase
      .from("candidates")
      .update({ vertetimi_printuar: true })
      .eq("id", candidateId);
    if (error) return;
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, vertetimiPrintuar: true } : c)),
    );
  };

  const setDokumenteTerhequr = async (candidateId: string, value: boolean) => {
    const { error } = await supabase
      .from("candidates")
      .update({ dokumente_terhequr: value })
      .eq("id", candidateId);
    if (error) return;
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, dokumenteTerhequr: value } : c)),
    );
  };

  return {
    candidates,
    loading,
    refresh,
    addCandidate,
    updateCandidate,
    addPayment,
    setVertetimiPrintuar,
    setDokumenteTerhequr,
  };
};
