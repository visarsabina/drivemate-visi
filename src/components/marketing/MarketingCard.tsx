import type { LucideIcon } from "lucide-react";

export interface MarketingCardProps {
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  live?: boolean;
  onClick: () => void;
}

/** Reusable card used by the Marketing AI dashboard grid. */
const MarketingCard = ({ label, description, icon: Icon, gradient, live, onClick }: MarketingCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className="glass-card rounded-xl p-3 sm:p-4 text-left transition-transform duration-200 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
  >
    <div
      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-black/10 mb-2`}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" strokeWidth={2} />
    </div>
    <div className="font-medium text-sm leading-tight">{label}</div>
    <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
    {!live && (
      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        Së shpejti
      </span>
    )}
  </button>
);

export default MarketingCard;
