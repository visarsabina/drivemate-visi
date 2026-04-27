import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setImpersonatedTenantId } from "@/hooks/useTenant";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Power,
  PowerOff,
  Loader2,
  LogOut,
  Globe,
  Users,
  Car,
  UserCheck,
} from "lucide-react";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  director_name: string | null;
  primary_color: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  admin_count: number;
  vehicles_count: number;
  employees_count: number;
}

const emptyForm = {
  name: "",
  slug: "",
  domain: "",
  phone: "",
  address: "",
  email: "",
  director_name: "",
  primary_color: "#0ea5e9",
  admin_email: "",
  admin_password: "",
};

const SuperAdmin = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_all_tenants_with_stats");
    if (error) {
      console.error(error);
      toast.error("S'mund të ngarkohen autoshkollat: " + error.message);
    } else {
      setTenants((data ?? []) as TenantRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSlugSuggest = (name: string) => {
    if (form.slug) return;
    const s = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((f) => ({ ...f, slug: s }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "super-admin-create-tenant",
        { body: form },
      );
      if (error) throw error;
      if ((data as { error?: string })?.error) {
        throw new Error((data as { error: string }).error);
      }
      toast.success(`Autoshkolla "${form.name}" u krijua me sukses!`);
      setForm(emptyForm);
      setCreateOpen(false);
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Gabim: " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (t: TenantRow) => {
    const { error } = await supabase.rpc("set_tenant_active", {
      _tenant_id: t.id,
      _is_active: !t.is_active,
    });
    if (error) {
      toast.error("Gabim: " + error.message);
      return;
    }
    toast.success(
      t.is_active
        ? `${t.name} u çaktivizua`
        : `${t.name} u aktivizua`,
    );
    load();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Super Admin</h1>
              <p className="text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Dilni
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gjithsej</p>
                  <p className="text-2xl font-bold">{tenants.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tenants.filter((t) => t.is_active).length}
                  </p>
                </div>
                <Power className="w-8 h-8 text-green-600/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Të çaktivizuara
                  </p>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {tenants.filter((t) => !t.is_active).length}
                  </p>
                </div>
                <PowerOff className="w-8 h-8 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenants table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Autoshkollat</CardTitle>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Shto autoshkollë
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Asnjë autoshkollë e regjistruar
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emri</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Domeni</TableHead>
                      <TableHead className="text-center">Admin</TableHead>
                      <TableHead className="text-center">Mjete</TableHead>
                      <TableHead className="text-center">Punëtorë</TableHead>
                      <TableHead>Statusi</TableHead>
                      <TableHead className="text-right">Veprime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="font-medium">{t.name}</div>
                          {t.director_name && (
                            <div className="text-xs text-muted-foreground">
                              {t.director_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {t.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          {t.domain
                            ? (
                              <a
                                href={`https://${t.domain}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
                              >
                                <Globe className="w-3 h-3" />
                                {t.domain}
                              </a>
                            )
                            : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <UserCheck className="w-3 h-3 text-muted-foreground" />
                            {t.admin_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Car className="w-3 h-3 text-muted-foreground" />
                            {t.vehicles_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            {t.employees_count}
                          </span>
                        </TableCell>
                        <TableCell>
                          {t.is_active
                            ? (
                              <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20 border-green-500/30">
                                Aktive
                              </Badge>
                            )
                            : (
                              <Badge variant="secondary">Çaktivizuar</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(t)}
                          >
                            {t.is_active
                              ? (
                                <>
                                  <PowerOff className="w-4 h-4 mr-1" />
                                  Çaktivizo
                                </>
                              )
                              : (
                                <>
                                  <Power className="w-4 h-4 mr-1" />
                                  Aktivizo
                                </>
                              )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shto autoshkollë të re</DialogTitle>
            <DialogDescription>
              Krijo autoshkollën dhe llogarinë e parë admin në një hap. Kredencialet
              duhet t'i dërgohen klientit.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Të dhënat e autoshkollës</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">Emri *</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      handleSlugSuggest(e.target.value);
                    }}
                    placeholder="Auto Shkolla Tina"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    required
                    value={form.slug}
                    onChange={(e) => {
                      const normalized = e.target.value
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9-]+/g, "-")
                        .replace(/^-+|-+$/g, "");
                      setForm({ ...form, slug: normalized });
                    }}
                    placeholder="tina"
                    pattern="[a-z0-9-]+"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Vetëm shkronja të vogla, numra dhe vija (-). Pa hapësira ose karaktere speciale.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="domain">Domeni (opsional)</Label>
                  <Input
                    id="domain"
                    value={form.domain}
                    onChange={(e) =>
                      setForm({ ...form, domain: e.target.value })}
                    placeholder="autoshkollatina.com"
                  />
                </div>
                <div>
                  <Label htmlFor="director_name">Drejtori</Label>
                  <Input
                    id="director_name"
                    value={form.director_name}
                    onChange={(e) =>
                      setForm({ ...form, director_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefoni</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Emaili i shkollës</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="primary_color">Ngjyra primare</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      className="w-16 p-1 h-10"
                      value={form.primary_color}
                      onChange={(e) =>
                        setForm({ ...form, primary_color: e.target.value })}
                    />
                    <Input
                      value={form.primary_color}
                      onChange={(e) =>
                        setForm({ ...form, primary_color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Adresa</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Llogaria admin</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="admin_email">Email admin *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    required
                    value={form.admin_email}
                    onChange={(e) =>
                      setForm({ ...form, admin_email: e.target.value })}
                    placeholder="admin@autoshkollatina.com"
                  />
                </div>
                <div>
                  <Label htmlFor="admin_password">Fjalëkalimi *</Label>
                  <Input
                    id="admin_password"
                    type="text"
                    required
                    minLength={8}
                    value={form.admin_password}
                    onChange={(e) =>
                      setForm({ ...form, admin_password: e.target.value })}
                    placeholder="Minimum 8 karaktere"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ruani këto kredenciale — duhet t'i dërgohen klientit.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={submitting}
              >
                Anulo
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Krijo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdmin;
