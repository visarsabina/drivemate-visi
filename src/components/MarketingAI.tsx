import { useState } from "react";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialPosts from "@/components/SocialPosts";
import MarketingCard from "@/components/marketing/MarketingCard";
import PostGenerator from "@/components/marketing/PostGenerator";
import { sections, type SectionDef } from "@/components/marketing/sections";


const MarketingAI = () => {
  const [active, setActive] = useState<SectionDef | null>(null);

  if (active) {
    const Icon = active.icon;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActive(null)} className="gap-1 px-2">
            <ArrowLeft className="w-4 h-4" />
            Kthehu
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-4 h-4 text-primary shrink-0" />
            <h3 className="font-semibold truncate">{active.label}</h3>
          </div>
        </div>

        {active.live ? (
          <SocialPosts />
        ) : (
          <div className="glass-card rounded-xl p-6 text-center space-y-3">
            <Construction className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Ky seksion është në përgatitje. {active.description}.
            </p>
            {active.integrations?.length ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {active.integrations.map((i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {i}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Qendra e marketingut me AI — përmbajtje, foto dhe publikim për rrjetet sociale.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sections.map((s) => (
          <MarketingCard
            key={s.id}
            label={s.label}
            description={s.description}
            icon={s.icon}
            gradient={s.gradient}
            live={s.live}
            onClick={() => setActive(s)}
          />
        ))}
      </div>
    </div>
  );
};

export default MarketingAI;
