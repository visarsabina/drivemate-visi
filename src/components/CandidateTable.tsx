import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Candidate } from "@/types/candidate";
import StatusBadge from "@/components/StatusBadge";

interface CandidateTableProps {
  candidates: Candidate[];
  onSelectCandidate?: (candidate: Candidate) => void;
}

const CandidateTable = ({ candidates }: CandidateTableProps) => {
  const [search, setSearch] = useState("");

  const filtered = candidates.filter(
    (c) =>
      c.emri.toLowerCase().includes(search.toLowerCase()) ||
      c.mbiemri.toLowerCase().includes(search.toLowerCase()) ||
      c.numriRegjistrimit.includes(search) ||
      c.telefon.includes(search)
  );

  return (
    <div className="glass-card rounded-xl">
      <div className="p-4 border-b border-border/50">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Kërko kandidatë..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
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
              <TableHead>Statusi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nuk u gjet asnjë kandidat
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const totalPaguar = c.payments.reduce((sum, p) => sum + p.shuma, 0);
                const borxhi = c.shumaMarreveshjes - totalPaguar;
                return (
                  <TableRow key={c.id}>
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
                      <StatusBadge status={c.statusi} />
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
