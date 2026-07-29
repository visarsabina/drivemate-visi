import { useState } from "react";
import { Loader2, Save, Sparkles, Hash, Megaphone, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/context/AuthContext";
import { useTenantBranding } from "@/hooks/useTenantBranding";

const PLATFORMS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "all", label: "Të gjitha" },
];

const CONTENT_TYPES = [
  { value: "offer", label: "Ofertë" },
  { value: "driving_tip", label: "Këshillë vozitjeje" },
  { value: "traffic_rules", label: "Rregulla trafiku" },
  { value: "student_success", label: "Sukses i kandidatit" },
  { value: "quiz", label: "Kuiz" },
  { value: "promotion", label: "Promocion" },
  { value: "announcement", label: "Njoftim" },
];

const CATEGORIES = ["B", "BE", "C1", "C", "CE", "D"];

const TONES = [
  { value: "professional", label: "Profesional" },
  { value: "friendly", label: "Miqësor" },
  { value: "funny", label: "Zbavitës" },
  { value: "motivational", label: "Motivues" },
];

const labelOf = (list: { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v;

/**
 * AI Post Generator — UI + database integration.
 * Text generation is a local placeholder for now; the OpenAI / AI Gateway
 * call will be plugged into `generate()` later without changing this UI.
 */
const PostGenerator = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { branding } = useTenantBranding();

  const [platform, setPlatform] = useState("all");
  const [contentType, setContentType] = useState("offer");
  const [category, setCategory] = useState("B");
  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("");
  const [instructions, setInstructions] = useState("");

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [cta, setCta] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const school = branding?.name || "Autoshkolla";

  const draftCaption = () =>
    [
      `${labelOf(CONTENT_TYPES, contentType)} — Kategoria ${category}`,
      "",
      `${school} të pret me instruktorë profesionistë dhe orar fleksibil për kategorinë ${category}.`,
      audience ? `Për: ${audience}.` : "",
      instructions ? `Shënim: ${instructions}` : "",
      "",
      `Ton: ${labelOf(TONES, tone)} · Platforma: ${labelOf(PLATFORMS, platform)}`,
    ]
      .filter(Boolean)
      .join("\n");

  const draftHashtags = () =>
    [
      "#autoshkolle",
      "#patentshofer",
      `#kategoria${category.toLowerCase()}`,
      "#vozitjeesigurt",
      "#kosove",
      `#${school.toLowerCase().replace(/[^a-z0-9]+/g, "")}`,
    ].join(" ");

  const draftCta = () =>
    `📞 Na kontakto sot dhe rezervo vendin tënd për kategorinë ${category}!`;

  const run = async (what: "caption" | "hashtags" | "cta" | "all") => {
    setBusy(what);
    // Placeholder until the AI provider is connected.
    await new Promise((r) => setTimeout(r, 350));
    if (what === "caption" || what === "all") setCaption(draftCaption());
    if (what === "hashtags" || what === "all") setHashtags(draftHashtags());
    if (what === "cta" || what === "all") setCta(draftCta());
    setBusy(null);
  };

  const save = async () => {
    if (!tenantId) {
      toast({ title: "Nuk u gjet autoshkolla", variant: "destructive" });
      return;
    }
    if (!caption.trim() && !hashtags.trim() && !cta.trim()) {
      toast({ title: "Gjenero së pari përmbajtjen", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("marketing_posts").insert({
      tenant_id: tenantId,
      platform,
      content_type: contentType,
      driving_category: category,
      tone,
      target_audience: audience || null,
      extra_instructions: instructions || null,
      caption: caption || null,
      hashtags: hashtags || null,
      cta: cta || null,
      status: "draft",
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Ruajtja dështoi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "U ruajt si draft" });
  };

  const hasContent = Boolean(caption || hashtags || cta);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Form */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Platforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Lloji i përmbajtjes</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Kategoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Toni</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audience">Audienca e synuar</Label>
          <Input
            id="audience"
            maxLength={200}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="p.sh. të rinj 18–25 vjeç"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="instructions">Udhëzime shtesë</Label>
          <Textarea
            id="instructions"
            rows={3}
            maxLength={1000}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="p.sh. përmend zbritjen 20% deri më 30 gusht"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" onClick={() => run("caption")} disabled={busy !== null} className="gap-2">
            {busy === "caption" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Teksti
          </Button>
          <Button variant="outline" onClick={() => run("hashtags")} disabled={busy !== null} className="gap-2">
            {busy === "hashtags" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
            Hashtag-et
          </Button>
          <Button variant="outline" onClick={() => run("cta")} disabled={busy !== null} className="gap-2">
            {busy === "cta" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
            CTA
          </Button>
          <Button onClick={() => run("all")} disabled={busy !== null} className="gap-2">
            {busy === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Gjenero të gjitha
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-sm">Parapamje</h4>
          <Button size="sm" onClick={save} disabled={saving || !hasContent} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Ruaj si draft
          </Button>
        </div>

        {!hasContent ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            Përmbajtja e gjeneruar do të shfaqet këtu.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="caption">Teksti</Label>
              <Textarea id="caption" rows={8} value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hashtags">Hashtag-et</Label>
              <Textarea id="hashtags" rows={2} value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cta">Thirrja për veprim</Label>
              <Textarea id="cta" rows={2} value={cta} onChange={(e) => setCta(e.target.value)} />
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Gjenerimi me AI (OpenAI) do të lidhet më vonë — tani përdoret një draft shabllon.
        </p>
      </div>
    </div>
  );
};

export default PostGenerator;
