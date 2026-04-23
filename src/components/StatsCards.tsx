import { Users } from "lucide-react";
import { Candidate } from "@/types/candidate";

interface StatsCardsProps {
  candidates: Candidate[];
}

const StatsCards = ({ candidates }: StatsCardsProps) => {
  const total = candidates.length;

  const stats = [
    { label: "Gjithsej", value: total, icon: Users, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
