import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Images, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useSchoolGallery, type GalleryPost } from "@/hooks/useSchoolGallery";
import { GalleryGrid } from "@/components/SchoolGallery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";

const emptyForm = () => ({ title: "", description: "", event_date: new Date().toLocaleDateString("en-CA") });

export default function GalleryManager() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading, isError, refetch } = useSchoolGallery(tenantId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<GalleryPost | null>(null);

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const openForm = (post: GalleryPost | null = null) => {
    setEditing(post);
    setForm(post ? { title: post.title, description: post.description, event_date: post.event_date } : emptyForm());
    setFile(null);
    setOpen(true);
  };
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["school-gallery", tenantId] });
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenantId || busy) return;
    if (!editing && !file) { toast.error("Zgjidhni një fotografi."); return; }
    setBusy(true);
    let newPath: string | null = null;
    try {
      let imagePath = editing?.image_path || "";
      if (file) {
        const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
        if (!extension || file.size > 10 * 1024 * 1024) throw new Error("Zgjidhni foto JPG, PNG ose WebP deri në 10 MB.");
        newPath = `${tenantId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("school-gallery").upload(newPath, file, { contentType: file.type });
        if (error) throw error;
        imagePath = newPath;
      }
      const payload = { tenant_id: tenantId, title: form.title.trim(), description: form.description.trim(), event_date: form.event_date, image_path: imagePath };
      const result = editing
        ? await supabase.from("school_gallery").update(payload).eq("id", editing.id).eq("tenant_id", tenantId).select("id").single()
        : await supabase.from("school_gallery").insert(payload).select("id").single();
      if (result.error) throw result.error;
      if (newPath && editing) await supabase.storage.from("school-gallery").remove([editing.image_path]);
      setOpen(false);
      await refresh();
      toast.success(editing ? "Postimi u përditësua." : "Postimi u publikua në galeri.");
    } catch (error) {
      if (newPath) await supabase.storage.from("school-gallery").remove([newPath]);
      toast.error(error instanceof Error ? error.message : "Postimi nuk u ruajt. Provoni përsëri.");
    } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleting || !tenantId || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("school_gallery").delete().eq("id", deleting.id).eq("tenant_id", tenantId).select("id").single();
      if (error) throw error;
      const { error: imageError } = await supabase.storage.from("school-gallery").remove([deleting.image_path]);
      if (imageError) toast.warning("Postimi u fshi, por fotografia nuk u largua nga hapësira e ruajtjes.");
      setDeleting(null);
      await refresh();
      toast.success("Postimi u fshi nga galeria.");
    } catch { toast.error("Postimi nuk u fshi. Provoni përsëri."); }
    finally { setBusy(false); }
  };
  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Historiku i autoshkollës</h3><Button disabled={!tenantId} onClick={() => openForm()}><Plus className="mr-2 h-4 w-4" />Shto postim</Button></div>
    {isLoading ? <p role="status" className="text-muted-foreground">Duke ngarkuar…</p> : isError ? <div className="space-y-3"><p>Galeria nuk u ngarkua.</p><Button variant="outline" onClick={() => refetch()}>Provo përsëri</Button></div> : posts.length ? <GalleryGrid posts={posts} onEdit={openForm} onDelete={setDeleting} /> : <div className="py-16 text-center text-muted-foreground"><Images className="mx-auto mb-4 h-10 w-10" /><p>Ende nuk ka postime.</p></div>}
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
        <DialogHeader><DialogTitle>{editing ? "Ndrysho postimin" : "Postim i ri"}</DialogTitle><DialogDescription>Postimi shfaqet publikisht në galerinë e autoshkollës.</DialogDescription></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="gallery-title">Titulli</Label><Input id="gallery-title" required maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="gallery-description">Përshkrimi</Label><Textarea id="gallery-description" maxLength={3000} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="gallery-date">Data e ngjarjes</Label><Input id="gallery-date" type="date" required value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="gallery-photo">Fotografia</Label><Input id="gallery-photo" type="file" accept="image/jpeg,image/png,image/webp" required={!editing} onChange={e => setFile(e.target.files?.[0] || null)} /><p className="text-xs text-muted-foreground">JPG, PNG ose WebP · deri në 10 MB</p></div>
          {(preview || editing?.imageUrl) && <img src={preview || editing?.imageUrl} alt="Fotografia e postimit" className="h-40 w-full rounded-lg object-contain bg-muted" />}
          <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Anulo</Button><Button type="submit" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Ruaj ndryshimet" : "Publiko"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={Boolean(deleting)} onOpenChange={value => { if (!busy && !value) setDeleting(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Të fshihet postimi?</AlertDialogTitle><AlertDialogDescription>“{deleting?.title}” dhe fotografia e tij do të largohen nga galeria.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Anulo</AlertDialogCancel><Button variant="destructive" disabled={busy} onClick={remove}>Fshi postimin</Button></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
}