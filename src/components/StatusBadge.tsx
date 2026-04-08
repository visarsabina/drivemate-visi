import { CandidateStatus } from "@/types/candidate";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<CandidateStatus, { label: string; className: string }> = {
  regjistuar: { label: "Regjistruar", className: "bg-primary/10 text-primary border-primary/20" },
  ne_proces: { label: "Në Proces", className: "bg-warning/10 text-warning border-warning/20" },
  kaluar: { label: "Kaluar", className: "bg-success/10 text-success border-success/20" },
  deshtur: { label: "Dështuar", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const StatusBadge = ({ status }: { status: CandidateStatus }) => {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
