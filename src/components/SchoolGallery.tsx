import { useState } from "react";
import { Images, Pencil, Trash2, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSchoolGallery, type GalleryPost } from "@/hooks/useSchoolGallery";

const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("sq-AL", { day: "numeric", month: "long", year: "numeric" });

export function GalleryGrid({ posts, onEdit, onDelete }: { posts: GalleryPost[]; onEdit?: (post: GalleryPost) => void; onDelete?: (post: GalleryPost) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const index = posts.findIndex(post => post.id === selectedId);
  const selected = posts[index];
  const move = (direction: number) => setSelectedId(posts[(index + direction + posts.length) % posts.length]?.id ?? null);
  return <>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map(post => <article key={post.id} className="overflow-hidden rounded-lg border border-border bg-card">
        <Button variant="ghost" className="block h-auto w-full rounded-none p-0 hover:bg-muted" onClick={() => setSelectedId(post.id)} aria-label={`Shiko foton: ${post.title}`}>
          {post.imageUrl ? <img src={post.imageUrl} alt={post.title} loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] flex items-center justify-center bg-muted"><ImageOff className="h-8 w-8 text-muted-foreground" /></div>}
        </Button>
        <div className="space-y-2 p-5">
          <time dateTime={post.event_date} className="text-xs text-muted-foreground">{dateLabel(post.event_date)}</time>
          <h3 className="break-words text-lg font-semibold">{post.title}</h3>
          {post.description && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{post.description}</p>}
          {onEdit && onDelete && <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="icon" title="Ndrysho postimin" aria-label={`Ndrysho ${post.title}`} onClick={() => onEdit(post)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" title="Fshi postimin" aria-label={`Fshi ${post.title}`} onClick={() => onDelete(post)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>}
        </div>
      </article>)}
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelectedId(null); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-lg">
        <DialogTitle className="pr-6 break-words">{selected?.title}</DialogTitle>
        <DialogDescription>{selected ? dateLabel(selected.event_date) : ""}</DialogDescription>
        {selected && <img src={selected.imageUrl} alt={selected.title} className="max-h-[60dvh] w-full object-contain" />}
        {selected?.description && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{selected.description}</p>}
        {posts.length > 1 && <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" aria-label="Fotoja e mëparshme" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">{index + 1} / {posts.length}</span>
          <Button variant="outline" size="icon" aria-label="Fotoja e ardhshme" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}

export default function SchoolGallery({ tenantId }: { tenantId?: string | null }) {
  const { data: posts = [], isLoading, isError, refetch } = useSchoolGallery(tenantId);
  return <section id="gallery" className="py-20 scroll-mt-20">
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <span className="text-primary font-semibold text-sm uppercase">Galeria</span>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">Historiku i autoshkollës</h2>
      </div>
      {isLoading ? <p className="text-center text-muted-foreground" role="status">Duke ngarkuar fotografitë…</p> : isError ? <div className="text-center space-y-3"><p className="text-muted-foreground">Fotografitë nuk u ngarkuan.</p><Button variant="outline" onClick={() => refetch()}>Provo përsëri</Button></div> : posts.length ? <GalleryGrid posts={posts} /> : <div className="py-10 text-center text-muted-foreground"><Images className="mx-auto mb-4 h-10 w-10" /><p>Fotografitë do të publikohen së shpejti.</p></div>}
    </div>
  </section>;
}