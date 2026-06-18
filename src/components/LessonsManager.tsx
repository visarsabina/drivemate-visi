import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDateDMY } from "@/lib/date";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface Lesson {
  id: string;
  data: string;
  hours: number;
}

interface LessonsManagerProps {
  candidateId: string;
  candidateName: string;
  totalLessons: number;
  /** If true, hide the add form (read-only view). */
  readOnly?: boolean;
}

const LessonsManager = ({ candidateId, candidateName, totalLessons, readOnly = false }: LessonsManagerProps) => {
  const { tenantId } = useTenant();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState("1");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("candidate_lessons")
      .select("id, data, hours")
      .eq("candidate_id", candidateId)
      .order("data", { ascending: false });
    if (error) {
      toast.error("Gabim gjatë ngarkimit: " + error.message);
      setLessons([]);
    } else {
      setLessons((rows ?? []).map((r: any) => ({ id: r.id, data: r.data, hours: Number(r.hours) })));
    }
    setLoading(false);
  }, [candidateId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalMbajtura = lessons.reduce((s, l) => s + l.hours, 0);
  const mbetur = Math.max(0, totalLessons - totalMbajtura);

  const handleAdd = async () => {
    const h = parseFloat(hours);
    if (!h || h <= 0) {
      toast.error("Vendos numër të vlefshëm orësh");
      return;
    }
    if (!tenantId) {
      toast.error("Autoshkolla nuk u gjet");
      return;
    }
    setSaving(true);
    const { data: row, error } = await supabase
      .from("candidate_lessons")
      .insert({
        tenant_id: tenantId,
        candidate_id: candidateId,
        data,
        hours: h,
        created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("Ruajtja dështoi: " + error.message);
      return;
    }
    setLessons((prev) => [{ id: row.id, data: row.data, hours: Number(row.hours) }, ...prev]);
    setHours("1");
    toast.success("Ora u shtua");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("candidate_lessons").delete().eq("id", id);
    if (error) {
      toast.error("Fshirja dështoi: " + error.message);
      return;
    }
    setLessons((prev) => prev.filter((l) => l.id !== id));
    toast.success("U fshi");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground">Totali</div>
          <div className="text-xl font-bold text-primary">{totalLessons}</div>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground">Mbajtura</div>
          <div className="text-xl font-bold">{totalMbajtura}</div>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground">Mbetur</div>
          <div className={`text-xl font-bold ${mbetur === 0 ? "text-green-600" : "text-amber-600"}`}>{mbetur}</div>
        </div>
      </div>

      {!readOnly && (
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium">
            <Clock className="w-4 h-4 text-primary" /> Shto orë për {candidateName}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Orë të mbajtura</Label>
              <div className="flex gap-2">
                {["1", "2", "3"].map((h) => (
                  <Button
                    key={h}
                    type="button"
                    variant={hours === h ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setHours(h)}
                  >
                    {h}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={handleAdd} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Shto
            </Button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nr.</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Orë</TableHead>
              {!readOnly && <TableHead className="w-16 text-right">Veprime</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 3 : 4} className="text-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 3 : 4} className="text-center py-6 text-muted-foreground text-sm">
                  Asnjë orë e mbajtur ende.
                </TableCell>
              </TableRow>
            ) : (
              lessons.map((l, i) => (
                <TableRow key={l.id}>
                  <TableCell>{lessons.length - i}</TableCell>
                  <TableCell>{formatDateDMY(l.data)}</TableCell>
                  <TableCell className="font-medium">{l.hours} orë</TableCell>
                  {!readOnly && (
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Fshij orën?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {formatDateDMY(l.data)} — {l.hours} orë
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulo</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(l.id)} className="bg-destructive text-destructive-foreground">
                              Fshij
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LessonsManager;
