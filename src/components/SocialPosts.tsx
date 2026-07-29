import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";

const PLATFORMS = ["Facebook", "Instagram", "TikTok", "LinkedIn"];
const TONES = ["Miqësor", "Profesional", "Argëtues", "Motivues", "Urgjent (ofertë)"];
const LENGTHS = ["Shkurt", "Mesatar", "Gjatë"];

const IDEAS = [
  "Regjistrimet e reja për kategorinë B janë të hapura",
  "Ofertë speciale për orë plotësuese praktike",
  "Urime kandidatëve që kaluan provimin këtë javë",
  "Këshilla sigurie në trafik për vozitësit e rinj",
  "Prezantimi i instruktorëve tanë",
];

const SocialPosts = () => {
  const { branding } = useTenantBranding();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Facebook");
  const [tone, setTone] = useState("Miqësor");
  const [length, setLength] = useState("Mesatar");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = async () => {
    if (!topic.trim()) {
      toast.error("Shkruani temën e postimit.");
      return;
    }
    setLoading(true);
    setVariants([]);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/social-posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? ""}`,
          },
          body: JSON.stringify({
            topic,
            platform,
            tone,
            length,
            contact,
            schoolName: branding?.name ?? "Auto Shkolla Visi",
          }),
        },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) throw new Error("Shumë kërkesa — provoni pas pak.");
        if (res.status === 402) throw new Error("Kreditet e AI kanë mbaruar.");
        throw new Error(payload?.error ?? "Gjenerimi dështoi.");
      }
      setVariants(payload.variants ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Gjenerimi dështoi.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      toast.success("U kopjua!");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Kopjimi dështoi.");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="topic">Tema e postimit</Label>
          <Textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="P.sh. Ofertë 10% zbritje për regjistrimet e kategorisë B gjatë gushtit"
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setTopic(idea)}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Platforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Toni</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gjatësia</Label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LENGTHS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact">Kontakti (opsional)</Label>
          <Input
            id="contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="044 241 200 · Rr. Zahir Pajaziti"
          />
        </div>

        <Button onClick={generate} disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Gjenero postimet
        </Button>
      </Card>

      {variants.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {variants.map((v, i) => (
            <Card key={i} className="flex flex-col gap-3 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{v}</p>
              <Button variant="outline" size="sm" className="mt-auto" onClick={() => copy(v, i)}>
                {copied === i ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Kopjo
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialPosts;
