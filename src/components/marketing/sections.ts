import {
  PenSquare,
  ImagePlus,
  Clapperboard,
  CalendarDays,
  Clock,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type SectionId =
  | "create-post"
  | "generate-image"
  | "video-script"
  | "calendar"
  | "scheduled"
  | "analytics";

/** Future integrations — declared here only, not implemented yet. */
export type Integration = "OpenAI" | "Meta Graph API" | "TikTok API" | "Supabase";

export interface SectionDef {
  id: SectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  /** Reuses the existing generator/library UI */
  live?: boolean;
  integrations?: Integration[];
}

export const sections: SectionDef[] = [
  {
    id: "create-post",
    label: "Krijo Postim",
    description: "Gjenero tekst për rrjetet sociale me AI",
    icon: PenSquare,
    gradient: "from-blue-500 to-indigo-600",
    live: true,
    integrations: ["OpenAI", "Supabase"],
  },
  {
    id: "generate-image",
    label: "Gjenero Foto",
    description: "Foto marketingu me AI ose kombino foton tënde",
    icon: ImagePlus,
    gradient: "from-emerald-500 to-teal-600",
    live: true,
    integrations: ["OpenAI", "Supabase"],
  },
  {
    id: "video-script",
    label: "Skenar Videoje",
    description: "Skenar i shkurtër për Reels dhe TikTok",
    icon: Clapperboard,
    gradient: "from-amber-500 to-orange-600",
    integrations: ["OpenAI", "TikTok API"],
  },
  {
    id: "calendar",
    label: "Kalendari i Përmbajtjes",
    description: "Planifiko temat javore dhe mujore",
    icon: CalendarDays,
    gradient: "from-pink-500 to-rose-600",
    integrations: ["Supabase", "Meta Graph API"],
  },
  {
    id: "scheduled",
    label: "Postimet e Planifikuara",
    description: "Draftet, historiku dhe publikimi",
    icon: Clock,
    gradient: "from-violet-500 to-purple-600",
    live: true,
    integrations: ["Supabase", "Meta Graph API", "TikTok API"],
  },
  {
    id: "analytics",
    label: "Analitika",
    description: "Shikime, pëlqime dhe angazhim për postim",
    icon: BarChart3,
    gradient: "from-cyan-500 to-sky-600",
    integrations: ["Meta Graph API", "TikTok API"],
  },
];
