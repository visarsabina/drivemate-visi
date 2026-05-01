import { useCallback, useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Mail, Phone, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  category: string;
  created_at: string;
}

const Registrations = () => {
  const { toast } = useToast();
  const { tenantId, loading: tenantLoading } = useTenant();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) {
      setRegistrations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, full_name, email, phone, category, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast({ title: "Gabim", description: "Ngarkimi i regjistrimeve dështoi", variant: "destructive" });
      setRegistrations([]);
    } else {
      setRegistrations((data ?? []) as Registration[]);
    }
    setLoading(false);
  }, [tenantId, toast]);

  useEffect(() => {
    if (tenantLoading) return;
    load();
  }, [tenantLoading, load]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) {
      toast({ title: "Gabim", description: "Fshirja dështoi", variant: "destructive" });
      return;
    }
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Regjistrimi u fshi" });
  };

  const handleClearAll = async () => {
    if (!tenantId) return;
    if (!confirm("A jeni të sigurt që doni t'i fshini të gjitha regjistrimet?")) return;
    const { error } = await supabase.from("registrations").delete().eq("tenant_id", tenantId);
    if (error) {
      toast({ title: "Gabim", description: "Fshirja dështoi", variant: "destructive" });
      return;
    }
    setRegistrations([]);
    toast({ title: "Të gjitha regjistrimet u fshinë" });
  };

  const filtered = registrations.filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kërkesat nga Vizitorët</h3>
          <p className="text-sm text-muted-foreground">
            Gjithsej: <strong>{registrations.length}</strong> regjistrime
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            Rifresko
          </Button>
          {registrations.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleClearAll}>
              <Trash2 className="w-4 h-4" /> Fshij të gjitha
            </Button>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Kërko sipas emrit, email, telefon ose kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Duke ngarkuar...</div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Ende nuk ka regjistrime</p>
            <p className="text-sm text-muted-foreground mt-1">
              Kërkesat nga formulari "Regjistrohu" në faqen kryesore do të shfaqen këtu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Emri dhe Mbiemri</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefoni</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Asnjë rezultat për kërkimin tuaj
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">{r.full_name}</TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${r.email}`}
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {r.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${r.phone}`}
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {r.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {r.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(r.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registrations;
