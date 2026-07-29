import { useState } from "react";
import {
  PenSquare,
  ImagePlus,
  Clapperboard,
  CalendarDays,
  Clock,
  BarChart3,
  Sparkles,
  ArrowLeft,
  Construction,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialPosts from "@/components/SocialPosts";

type SectionId =
  | "create-post"
  | "generate-image"
  | "video-script"
  | "calendar"
  | "scheduled"
  | "analytics"
  | "assistant";

interface SectionDef {
  id: SectionId;
  label: string;
  description: string;
  icon: typeof PenSquare;
  /** Reuses the existing generator/library UI */
  live?: boolean;
  /** Future third-party integrations this section will use */
  integrations?: string[];
}

const sections: SectionDef[] = [
  {
    id: "create-post",
    label: "Krijo Postim",
    description: "Gjenero tekst për rrjetet sociale me AI",
    icon: PenSquare,
    live: true,
  },
  {
    id: "generate-image",
    label: "Gjenero Foto",
    description: "Foto marketingu me AI ose kombino foton tënde",
    icon: ImagePlus,
    live: true,
  },
  {
    id: "video-script",
    label: "Skenar Videoje",
    description: "Skenar i shkurtër për Reels dhe TikTok",
    icon: Clapperboard,
    integrations: ["OpenAI"],
  },
  {
    id: "calendar",
    label: "Kalendari i Përmbajtjes",
    description: "Planifiko temat javore dhe mujore",
    icon: CalendarDays,
    integrations: ["Meta API"],
  },
  {
    id: "scheduled",
    label: "Postimet e Planifikuara",
    description: "Draftet, historiku dhe publikimi",
    icon: Clock,
    live: true,
  },
  {
    id: "analytics",
    label: "Analitika",
    description: "Shikime, pëlqime dhe angazhim për postim",
    icon: BarChart3,
    integrations: ["Meta API", "TikTok API"],
  },
  {
    id: "assistant",
    label: "Asistenti AI",
    description: "Ide dhe këshilla marketingu për autoshkollën",
    icon: Sparkles,
    integrations: ["OpenAI"],
  },
];

const gradients = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-sky-600",
  "from-fuchsia-500 to-pink-600",
];

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
        {sections.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className="glass-card rounded-xl p-3 sm:p-4 text-left transition-transform duration-200 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center shadow-lg shadow-black/10 mb-2`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" strokeWidth={2} />
              </div>
              <div className="font-medium text-sm leading-tight">{s.label}</div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
                {s.description}
              </p>
              {!s.live && (
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Së shpejti
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MarketingAI;
