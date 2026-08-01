import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Copy,
  Heart,
  History,
  Loader2,
  MessageCircle,
  Music2,
  Save,
  Send,
  Share2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/context/AuthContext";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { formatDateTimeDMY } from "@/lib/date";

const PLATFORMS = [
  { value: "all", label: "Të gjitha" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
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

const CATEGORIES = ["B", "BE", "C1", "C", "D"];

const CAMPAIGNS = [
  { value: "none", label: "Pa kampanjë" },
  { value: "enrollment", label: "Regjistrime të reja" },
  { value: "seasonal", label: "Ofertë sezonale" },
  { value: "extra_lessons", label: "Orë plotësuese" },
  { value: "exam_prep", label: "Përgatitje për provim" },
  { value: "brand", label: "Ndërtim brendi" },
];

const AUDIENCES = [
  { value: "young", label: "Të rinj 18–25" },
  { value: "students", label: "Studentë" },
  { value: "parents", label: "Prindër" },
  { value: "professionals", label: "Shoferë profesionistë" },
  { value: "everyone", label: "Publiku i gjerë" },
];

const TONES = [
  { value: "professional", label: "Profesional" },
  { value: "friendly", label: "Miqësor" },
  { value: "funny", label: "Zbavitës" },
  { value: "motivational", label: "Motivues" },
];

const labelOf = (list: { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v;

interface StudioDoc {
  brief: string;
  platform: string;
  contentType: string;
  category: string;
  campaign: string;
  audience: string;
  tone: string;
  title: string;
  caption: string;
  cta: string;
  hashtags: string;
  notes: string;
}

interface Version {
  id: string;
  at: string;
  label: string;
  doc: StudioDoc;
}

const emptyDoc: StudioDoc = {
  brief: "",
  platform: "all",
  contentType: "offer",
  category: "B",
  campaign: "none",
  audience: "young",
  tone: "professional",
  title: "",
  caption: "",
  cta: "",
  hashtags: "",
  notes: "",
};

const DRAFT_KEY = "marketing_content_studio_draft";
const VERSIONS_KEY = "marketing_content_studio_versions";

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const ContentStudio = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { branding } = useTenantBranding();

  const [doc, setDoc] = useState<StudioDoc>(() => load(DRAFT_KEY, emptyDoc));
  const [versions, setVersions] = useState<Version[]>(() => load<Version[]>(VERSIONS_KEY, []));
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const school = branding?.name || "Autoshkolla";

  const set = <K extends keyof StudioDoc>(key: K, value: StudioDoc[K]) =>
    setDoc((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(doc));
    } catch {
      /* ignore */
    }
  }, [doc]);

  const pushVersion = (label: string, snapshot: StudioDoc) => {
    const next: Version[] = [
      { id: crypto.randomUUID(), at: new Date().toISOString(), label, doc: snapshot },
      ...versions,
    ].slice(0, 20);
    setVersions(next);
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const generate = async () => {
    setBusy("generate");
    await new Promise((r) => setTimeout(r, 350));
    const title = `${labelOf(CONTENT_TYPES, doc.contentType)} — Kategoria ${doc.category}`;
    setDoc((d) => ({
      ...d,
      title: d.title || title,
      caption:
        d.caption ||
        [
          `${school} të pret me instruktorë profesionistë dhe orar fleksibil për kategorinë ${d.category}.`,
          d.brief ? `Fokusi: ${d.brief}` : "",
          `Për: ${labelOf(AUDIENCES, d.audience)} · Ton: ${labelOf(TONES, d.tone)}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      cta: d.cta || `📞 Na kontakto sot dhe rezervo vendin tënd për kategorinë ${d.category}!`,
      hashtags:
        d.hashtags ||
        [
          "#autoshkolle",
          "#patentshofer",
          `#kategoria${d.category.toLowerCase()}`,
          "#vozitjeesigurt",
          "#kosove",
          `#${school.toLowerCase().replace(/[^a-z0-9]+/g, "")}`,
        ].join(" "),
    }));
    setBusy(null);
  };

  const persist = async (status: string, publishDate: string | null) => {
    if (!tenantId) {
      toast({ title: "Nuk u gjet autoshkolla", variant: "destructive" });
      return false;
    }
    if (!doc.caption.trim() && !doc.title.trim()) {
      toast({ title: "Shkruaj së pari titullin ose tekstin", variant: "destructive" });
      return false;
    }
    const { error } = await supabase.from("marketing_posts").insert({
      tenant_id: tenantId,
      title: (doc.title || doc.caption).slice(0, 120),
      platform: doc.platform,
      content_type: doc.contentType,
      category: doc.category,
      driving_category: doc.category,
      tone: doc.tone,
      target_audience: labelOf(AUDIENCES, doc.audience),
      extra_instructions:
        [
          doc.campaign !== "none" ? `Kampanja: ${labelOf(CAMPAIGNS, doc.campaign)}` : "",
          doc.brief ? `Brief: ${doc.brief}` : "",
          doc.notes ? `Shënime: ${doc.notes}` : "",
        ]
          .filter(Boolean)
          .join("\n") || null,
      caption: doc.caption || null,
      hashtags: doc.hashtags || null,
      cta: doc.cta || null,
      status,
      publish_date: publishDate,
      created_by: user?.id ?? null,
    });
    if (error) {
      toast({ title: "Ruajtja dështoi", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const saveDraft = async () => {
    setBusy("draft");
    const ok = await persist("draft", null);
    setBusy(null);
    if (ok) {
      pushVersion("Draft i ruajtur", doc);
      toast({ title: "U ruajt si draft" });
    }
  };

  const duplicate = () => {
    const copy: StudioDoc = { ...doc, title: `${doc.title || "Postim"} (kopje)` };
    pushVersion("Para dublikimit", doc);
    setDoc(copy);
    toast({ title: "Përmbajtja u dublikua" });
  };

  const schedule = async () => {
    if (!scheduleAt) {
      toast({ title: "Zgjidh datën dhe orën", variant: "destructive" });
      return;
    }
    setBusy("schedule");
    const ok = await persist("scheduled", new Date(scheduleAt).toISOString());
    setBusy(null);
    if (ok) {
      pushVersion(`Planifikuar për ${formatDateTimeDMY(scheduleAt)}`, doc);
      toast({ title: "Postimi u planifikua" });
    }
  };

  const publish = async () => {
    setBusy("publish");
    const ok = await persist("published", new Date().toISOString());
    setBusy(null);
    if (ok) {
      pushVersion("Publikuar", doc);
      toast({ title: "Postimi u shënua si i publikuar" });
    }
  };

  const fullText = useMemo(
    () => [doc.caption, doc.cta, doc.hashtags].filter(Boolean).join("\n\n"),
    [doc.caption, doc.cta, doc.hashtags],
  );

  const avatar = (
    <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
      {branding?.logo_url ? (
        <img src={branding.logo_url} alt={`Logo e ${school}`} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-primary">{school.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
      {/* LEFT — brief & targeting */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Brief-i i përmbajtjes
        </h4>

        <div className="space-y-1.5">
          <Label htmlFor="brief">Çfarë duam të komunikojmë?</Label>
          <Textarea
            id="brief"
            rows={4}
            maxLength={1000}
            value={doc.brief}
            onChange={(e) => set("brief", e.target.value)}
            placeholder="p.sh. zbritje 20% për regjistrimet e gushtit"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Platforma</Label>
          <Select value={doc.platform} onValueChange={(v) => set("platform", v)}>
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
          <Select value={doc.contentType} onValueChange={(v) => set("contentType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Kategoria</Label>
            <Select value={doc.category} onValueChange={(v) => set("category", v)}>
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
            <Select value={doc.tone} onValueChange={(v) => set("tone", v)}>
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
          <Label>Kampanja</Label>
          <Select value={doc.campaign} onValueChange={(v) => set("campaign", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CAMPAIGNS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Audienca</Label>
          <Select value={doc.audience} onValueChange={(v) => set("audience", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AUDIENCES.map((a) => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={generate} disabled={busy !== null} className="w-full gap-2">
          {busy === "generate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Gjenero përmbajtjen
        </Button>
      </div>

      {/* CENTER — editor */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold text-sm">Editori</h4>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={saveDraft} disabled={busy !== null} className="gap-1.5">
              {busy === "draft" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Ruaj draft
            </Button>
            <Button size="sm" variant="outline" onClick={duplicate} className="gap-1.5">
              <Copy className="w-3.5 h-3.5" /> Dubliko
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <History className="w-3.5 h-3.5" /> Historiku
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Historiku i versioneve</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[80vh] mt-4 pr-3">
                  {versions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nuk ka versione të ruajtura.</p>
                  ) : (
                    <div className="space-y-2">
                      {versions.map((v) => (
                        <div key={v.id} className="rounded-lg border p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">{v.label}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTimeDMY(v.at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {v.doc.title || v.doc.caption || "—"}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setDoc(v.doc);
                              toast({ title: "Versioni u rikthye" });
                            }}
                          >
                            Rikthe këtë version
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor="title">Titulli</Label>
          <Input
            id="title"
            maxLength={120}
            value={doc.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Titulli i postimit"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="caption">Teksti</Label>
          <Textarea
            id="caption"
            rows={10}
            value={doc.caption}
            onChange={(e) => set("caption", e.target.value)}
            placeholder="Teksti kryesor i postimit"
          />
          <p className="text-[11px] text-muted-foreground text-right">{doc.caption.length} karaktere</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cta">Thirrja për veprim (CTA)</Label>
            <Textarea id="cta" rows={3} value={doc.cta} onChange={(e) => set("cta", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hashtags">Hashtag-et</Label>
            <Textarea
              id="hashtags"
              rows={3}
              value={doc.hashtags}
              onChange={(e) => set("hashtags", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Shënime të brendshme</Label>
          <Textarea
            id="notes"
            rows={3}
            value={doc.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Nuk publikohet — vetëm për ekipin"
          />
        </div>

        <Separator />

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="scheduleAt">Planifiko për</Label>
            <Input
              id="scheduleAt"
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="w-[220px]"
            />
          </div>
          <Button variant="outline" onClick={schedule} disabled={busy !== null} className="gap-1.5">
            {busy === "schedule" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
            Planifiko
          </Button>
          <Button onClick={publish} disabled={busy !== null} className="gap-1.5">
            {busy === "publish" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publiko
          </Button>
        </div>
      </div>

      {/* RIGHT — live preview */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm">Parapamje e drejtpërdrejtë</h4>

        <Tabs defaultValue="facebook">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="facebook">Facebook</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="tiktok">TikTok</TabsTrigger>
          </TabsList>

          {/* Facebook */}
          <TabsContent value="facebook" className="mt-3">
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2">
                {avatar}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{school}</p>
                  <p className="text-[11px] text-muted-foreground">Sponsorizuar · 🌐</p>
                </div>
              </div>
              {doc.title ? <p className="text-sm font-semibold">{doc.title}</p> : null}
              <p className="text-sm whitespace-pre-wrap break-words">
                {fullText || "Teksti i postimit do të shfaqet këtu."}
              </p>
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Vendi i fotos
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> Pëlqej</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> Komento</span>
                <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> Shpërndaj</span>
              </div>
            </div>
          </TabsContent>

          {/* Instagram */}
          <TabsContent value="instagram" className="mt-3">
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-2 p-3">
                {avatar}
                <p className="text-sm font-semibold truncate">
                  {school.toLowerCase().replace(/\s+/g, "_")}
                </p>
              </div>
              <div className="aspect-square bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Vendi i fotos (1:1)
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  <MessageCircle className="w-4 h-4" />
                  <Share2 className="w-4 h-4" />
                </div>
                <p className="text-xs whitespace-pre-wrap break-words">
                  <span className="font-semibold">
                    {school.toLowerCase().replace(/\s+/g, "_")}{" "}
                  </span>
                  {[doc.caption, doc.cta].filter(Boolean).join("\n\n") ||
                    "Përshkrimi do të shfaqet këtu."}
                </p>
                {doc.hashtags ? (
                  <p className="text-xs text-primary break-words">{doc.hashtags}</p>
                ) : null}
              </div>
            </div>
          </TabsContent>

          {/* TikTok */}
          <TabsContent value="tiktok" className="mt-3">
            <div className="relative rounded-xl overflow-hidden border bg-foreground/90 aspect-[9/16]">
              <div className="absolute inset-0 flex items-center justify-center text-xs text-background/70">
                Vendi i videos (9:16)
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1 bg-gradient-to-t from-foreground/80 to-transparent">
                <p className="text-xs font-semibold text-background">
                  @{school.toLowerCase().replace(/\s+/g, "")}
                </p>
                <p className="text-xs text-background/90 line-clamp-3 whitespace-pre-wrap break-words">
                  {[doc.caption, doc.cta].filter(Boolean).join(" ") || "Përshkrimi i videos…"}
                </p>
                {doc.hashtags ? (
                  <p className="text-[11px] text-background/80 line-clamp-2">{doc.hashtags}</p>
                ) : null}
                <p className="text-[11px] text-background/70 flex items-center gap-1">
                  <Music2 className="w-3 h-3" /> Zë origjinal — {school}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="secondary">{labelOf(PLATFORMS, doc.platform)}</Badge>
          <Badge variant="secondary">Kat. {doc.category}</Badge>
          <Badge variant="secondary">{labelOf(TONES, doc.tone)}</Badge>
          {doc.campaign !== "none" ? (
            <Badge variant="secondary">{labelOf(CAMPAIGNS, doc.campaign)}</Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ContentStudio;
