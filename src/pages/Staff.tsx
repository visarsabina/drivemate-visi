import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/logo.png";

type StaffMember = {
  id: string;
  name: string;
  role: string;
  categories: string | null;
  photo_url: string | null;
};

const ALL_CATEGORIES = ["B", "C1", "C", "CE", "D"] as const;
type Cat = (typeof ALL_CATEGORIES)[number] | "Të gjitha";

const parseCats = (raw: string | null): string[] =>
  (raw ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

const Staff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Cat>("Të gjitha");

  useEffect(() => {
    document.title = "Stafi & Instruktorët | Autoshkolla Visi";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Njihuni me instruktorët e Autoshkollës Visi. Filtroni sipas kategorive B, C1, C, CE, D.");

    supabase
      .from("staff")
      .select("id, name, role, categories, photo_url")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setStaff(data as StaffMember[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (filter === "Të gjitha") return staff;
    return staff.filter((m) => parseCats(m.categories).includes(filter));
  }, [staff, filter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { "Të gjitha": staff.length };
    for (const cat of ALL_CATEGORIES) {
      map[cat] = staff.filter((m) => parseCats(m.categories).includes(cat)).length;
    }
    return map;
  }, [staff]);

  const filters: Cat[] = ["Të gjitha", ...ALL_CATEGORIES];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Autoshkolla Visi" width={36} height={36} />
            <span className="font-bold">Autoshkolla Visi</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-1" /> Kryefaqja
            </Link>
          </Button>
        </div>
      </header>

      <section className="py-12 md:py-16 bg-muted/40 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Ekipi Ynë</span>
          <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-4">Stafi & Instruktorët</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Filtroni instruktorët sipas kategorisë së patentës që ju intereson.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {filters.map((f) => {
              const active = filter === f;
              const count = counts[f] ?? 0;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {f === "Të gjitha" ? "Të gjithë" : `Kategoria ${f}`}
                  <span className={`ml-2 text-xs ${active ? "opacity-90" : "text-muted-foreground"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-16">Duke u ngarkuar...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Nuk ka instruktorë për këtë kategori.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((member) => {
                const cats = parseCats(member.categories);
                return (
                  <Card
                    key={member.id}
                    className="overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={`${member.role} ${member.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <User className="w-24 h-24 text-primary/40" />
                      )}
                    </div>
                    <CardContent className="p-5 text-center">
                      <h2 className="font-bold text-lg mb-1">{member.name}</h2>
                      <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                      {cats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {cats.map((c) => (
                            <span
                              key={c}
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                                filter !== "Të gjitha" && filter === c
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-primary/10 text-primary border-primary/20"
                              }`}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Staff;
