import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Candidate } from "@/types/candidate";
import InstructorPicker from "@/components/InstructorPicker";
import { useAuth } from "@/context/AuthContext";

interface CandidateTableProps {
  candidates: Candidate[];
  onSelectCandidate?: (candidate: Candidate) => void;
  onToggleDocuments?: (candidateId: string, value: boolean) => void;
}

const CandidateTable = ({ candidates, onSelectCandidate, onToggleDocuments }: CandidateTableProps) => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [vertetimiFilter, setVertetimiFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const parseRegNumber = (reg: string) => {
    const num = parseInt(reg.split("/")[0], 10);
    return isNaN(num) ? 0 : num;
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.kategoria) set.add(c.kategoria);
    });
    return Array.from(set).sort();
  }, [candidates]);

  const years = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.dataRegjistrimit) set.add(c.dataRegjistrimit.slice(0, 4));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [candidates]);

  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.emri.toLowerCase().includes(q) ||
      c.mbiemri.toLowerCase().includes(q) ||
      c.numriRegjistrimit.includes(search) ||
      (c.numriPersonal ?? "").includes(search) ||
      c.telefon.includes(search);

    const matchesYear = yearFilter === "all" || c.dataRegjistrimit.startsWith(yearFilter);

    const totalPaguar = c.payments.reduce((sum, p) => sum + p.shuma, 0);
    const borxhi = c.shumaMarreveshjes - totalPaguar;
    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paguar" && borxhi <= 0) ||
      (paymentFilter === "borxh" && borxhi > 0);

    const matchesVertetimi =
      vertetimiFilter === "all" ||
      (vertetimiFilter === "po" && c.vertetimiPrintuar) ||
      (vertetimiFilter === "jo" && !c.vertetimiPrintuar);

    const matchesCategory = categoryFilter === "all" || c.kategoria === categoryFilter;

    return matchesSearch && matchesYear && matchesPayment && matchesVertetimi && matchesCategory;
  }).sort((a, b) => {
    const diff = parseRegNumber(b.numriRegjistrimit) - parseRegNumber(a.numriRegjistrimit);
    return sortOrder === "desc" ? diff : -diff;
  });

  return (
    <div className="glass-card rounded-xl">
      <div className="p-4 border-b border-border/50 space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Kërko kandidatë..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Viti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjitha vitet</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Pagesa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjitha pagesat</SelectItem>
              <SelectItem value="paguar">Paguar plotësisht</SelectItem>
              <SelectItem value="borxh">Me borxh</SelectItem>
            </SelectContent>
          </Select>

          <Select value={vertetimiFilter} onValueChange={setVertetimiFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Vërtetimi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjithë</SelectItem>
              <SelectItem value="po">Vërtetim i printuar</SelectItem>
              <SelectItem value="jo">Pa vërtetim</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjitha kategoritë</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>Kategoria {cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(v: "desc" | "asc") => setSortOrder(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Renditja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Më të rejat në krye</SelectItem>
              <SelectItem value="asc">Më të vjetrat në krye</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nr. Regj.</TableHead>
              <TableHead>Emri</TableHead>
              <TableHead>Mbiemri</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead>Data Regj.</TableHead>
              <TableHead>Paguar</TableHead>
              <TableHead>Borxhi</TableHead>
              <TableHead>Vërtetimi</TableHead>
              {isAdmin && <TableHead>Instruktori</TableHead>}
              <TableHead className="text-center">Dokumentet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-8 text-muted-foreground">
                  Nuk u gjet asnjë kandidat
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const totalPaguar = c.payments.reduce((sum, p) => sum + p.shuma, 0);
                const borxhi = c.shumaMarreveshjes - totalPaguar;
                return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectCandidate?.(c)}>
                    <TableCell className="font-medium">{c.numriRegjistrimit}</TableCell>
                    <TableCell>{c.emri}</TableCell>
                    <TableCell>{c.mbiemri}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-sm">
                        {c.kategoria}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.dataRegjistrimit}</TableCell>
                    <TableCell className="text-primary font-medium">{totalPaguar.toFixed(2)} €</TableCell>
                    <TableCell className={borxhi > 0 ? "text-destructive font-medium" : "text-primary font-medium"}>
                      {borxhi.toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.vertetimiPrintuar ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {c.vertetimiPrintuar ? "Vërtetim ✓" : "Vërtetim ✗"}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <InstructorPicker
                          candidateId={c.id}
                          currentInstructorId={c.instructorId ?? null}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={!!c.dokumenteTerhequr}
                        onCheckedChange={(val) => onToggleDocuments?.(c.id, !!val)}
                        aria-label="Tërheqja e dokumenteve"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CandidateTable;
