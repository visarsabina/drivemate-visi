import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, UserPlus, Loader2, Pencil, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { formatDateDMY } from "@/lib/date";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserRow {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  is_admin: boolean;
  is_instructor: boolean;
}

interface CandidateUserRow {
  user_id: string;
  candidate_id: string;
  email: string;
  emri: string;
  mbiemri: string;
  numri_personal: string | null;
  numri_regjistrimit: string | null;
  created_at: string;
}

const Users = () => {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<"staff" | "candidates">("staff");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [candUsers, setCandUsers] = useState<CandidateUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Invite
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "instructor" | "user">("admin");
  const [inviting, setInviting] = useState(false);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ user_id: string; email: string; first_name: string; last_name: string } | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Candidate password reset
  const [pwOpen, setPwOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState<CandidateUserRow | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const [staffRes, candRes] = await Promise.all([
      supabase.rpc("list_users_in_my_tenant"),
      supabase.rpc("list_candidate_users_in_my_tenant"),
    ]);
    if (staffRes.error) toast.error("Gabim: " + staffRes.error.message);
    else setUsers((staffRes.data as UserRow[]) ?? []);
    if (candRes.error) toast.error("Gabim kandidatët: " + candRes.error.message);
    else setCandUsers((candRes.data as CandidateUserRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const grantAdmin = async (userId: string, label: string) => {
    setActionLoading(userId);
    const { error } = await supabase.rpc("grant_admin_role", { _target_user_id: userId });
    if (error) toast.error("Gabim: " + error.message);
    else { toast.success(`${label} është bërë admin`); await loadUsers(); }
    setActionLoading(null);
  };

  const revokeAdmin = async (userId: string, label: string) => {
    setActionLoading(userId);
    const { error } = await supabase.rpc("revoke_admin_role", { _target_user_id: userId });
    if (error) toast.error("Gabim: " + error.message);
    else { toast.success(`Roli admin u hoq nga ${label}`); await loadUsers(); }
    setActionLoading(null);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !invitePassword) return toast.error("Plotëso email dhe fjalëkalim");
    if (!inviteFirstName.trim() || !inviteLastName.trim()) return toast.error("Plotëso emrin dhe mbiemrin");
    if (invitePassword.length < 6) return toast.error("Fjalëkalimi duhet të ketë së paku 6 karaktere");
    setInviting(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user-in-tenant", {
      body: {
        email: inviteEmail,
        password: invitePassword,
        first_name: inviteFirstName.trim(),
        last_name: inviteLastName.trim(),
        role: inviteRole,
      },
    });
    if (error || (data as { error?: string })?.error) {
      const msg = (data as { error?: string })?.error ?? error?.message ?? "Gabim";
      toast.error("Gabim: " + msg);
      setInviting(false);
      return;
    }
    const roleLabel = inviteRole === "admin" ? "admin" : inviteRole === "instructor" ? "instruktor" : "përdorues";
    toast.success(`${inviteFirstName} ${inviteLastName} u krijua si ${roleLabel}`);
    setInviteEmail(""); setInvitePassword(""); setInviteFirstName(""); setInviteLastName(""); setInviteRole("admin");
    setInviteOpen(false); setInviting(false);
    await loadUsers();
  };

  const openEdit = (u: UserRow) => {
    setEditTarget({ user_id: u.user_id, email: u.email, first_name: u.first_name ?? "", last_name: u.last_name ?? "" });
    setEditFirstName(u.first_name ?? "");
    setEditLastName(u.last_name ?? "");
    setEditPassword("");
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editFirstName.trim() || !editLastName.trim()) return toast.error("Emri dhe mbiemri janë të detyrueshëm");
    if (editPassword && editPassword.length < 6) return toast.error("Fjalëkalimi duhet të ketë së paku 6 karaktere");
    setEditSaving(true);
    const body: Record<string, unknown> = {
      target_user_id: editTarget.user_id,
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
    };
    if (editPassword) body.password = editPassword;
    const { data, error } = await supabase.functions.invoke("admin-update-user-in-tenant", { body });
    setEditSaving(false);
    if (error || (data as { error?: string })?.error) {
      toast.error("Gabim: " + ((data as { error?: string })?.error ?? error?.message ?? "Gabim"));
      return;
    }
    toast.success("Përdoruesi u përditësua");
    setEditOpen(false); setEditTarget(null);
    await loadUsers();
  };

  const openPwReset = (c: CandidateUserRow) => {
    setPwTarget(c); setPwValue(""); setPwOpen(true);
  };

  const handlePwReset = async () => {
    if (!pwTarget) return;
    if (pwValue.length < 6) return toast.error("Fjalëkalimi duhet të ketë së paku 6 karaktere");
    setPwSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-update-user-in-tenant", {
      body: { target_user_id: pwTarget.user_id, password: pwValue },
    });
    setPwSaving(false);
    if (error || (data as { error?: string })?.error) {
      toast.error("Gabim: " + ((data as { error?: string })?.error ?? error?.message ?? "Gabim"));
      return;
    }
    toast.success(`Fjalëkalimi u ndryshua për ${pwTarget.emri} ${pwTarget.mbiemri}`);
    setPwOpen(false); setPwTarget(null);
  };

  const removeFromTenant = async (userId: string, label: string) => {
    setActionLoading(userId);
    const { error } = await supabase.rpc("remove_user_from_my_tenant", { _target_user_id: userId });
    if (error) toast.error("Gabim: " + error.message);
    else { toast.success(`${label} u hoq nga autoshkolla`); await loadUsers(); }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Përdoruesit</h2>
          <p className="text-sm text-muted-foreground">Menaxho stafin dhe llogaritë e kandidatëve</p>
        </div>
        {tab === "staff" && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="w-4 h-4 mr-2" />Shto Përdorues</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Shto Përdorues të Ri</DialogTitle>
                <DialogDescription>Krijo një llogari të re për stafin (admin / instruktor).</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="invite-first-name">Emri</Label>
                    <Input id="invite-first-name" value={inviteFirstName} onChange={(e) => setInviteFirstName(e.target.value)} placeholder="Emri" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-last-name">Mbiemri</Label>
                    <Input id="invite-last-name" value={inviteLastName} onChange={(e) => setInviteLastName(e.target.value)} placeholder="Mbiemri" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-password">Fjalëkalimi (min. 6 karaktere)</Label>
                  <Input id="invite-password" type="text" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} placeholder="Fjalëkalimi i përkohshëm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Roli</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "instructor" | "user")}>
                    <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin (qasje e plotë)</SelectItem>
                      <SelectItem value="instructor">Instruktor (vetëm kandidatët e tij)</SelectItem>
                      <SelectItem value="user">Përdorues (pa rol të caktuar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>Anulo</Button>
                <Button onClick={handleInvite} disabled={inviting}>
                  {inviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Krijo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "staff" ? "default" : "outline"} size="sm" onClick={() => setTab("staff")}>
          Stafi ({users.length})
        </Button>
        <Button variant={tab === "candidates" ? "default" : "outline"} size="sm" onClick={() => setTab("candidates")}>
          Kandidatët ({candUsers.length})
        </Button>
      </div>

      {tab === "staff" && (
        <div className="glass-card rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emri Mbiemri</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data e Regjistrimit</TableHead>
                <TableHead>Roli</TableHead>
                <TableHead className="text-right">Veprime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline" /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Asnjë përdorues</TableCell></TableRow>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?.id === u.user_id;
                  const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">
                        {fullName || <span className="text-muted-foreground italic">Pa emër</span>}
                        {isSelf && <span className="text-xs text-muted-foreground ml-2">(ti)</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateDMY(u.created_at)}</TableCell>
                      <TableCell>
                        {u.is_admin ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">Admin</Badge>
                        ) : u.is_instructor ? (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20" variant="outline">Instruktor</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Përdorues</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                            <Pencil className="w-4 h-4 mr-1" />Modifiko
                          </Button>
                          {u.is_admin ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isSelf || actionLoading === u.user_id}>
                                  <ShieldOff className="w-4 h-4 mr-1" />Hiq Admin
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hiqe rolin admin?</AlertDialogTitle>
                                  <AlertDialogDescription>{u.email} nuk do të ketë më qasje në panelin admin.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Anulo</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => revokeAdmin(u.user_id, fullName || u.email)}>Hiqe</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => grantAdmin(u.user_id, fullName || u.email)} disabled={actionLoading === u.user_id}>
                              <ShieldCheck className="w-4 h-4 mr-1" />Bëje Admin
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={isSelf || actionLoading === u.user_id} className="text-destructive hover:text-destructive">
                                Hiq nga shkolla
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hiqe nga autoshkolla?</AlertDialogTitle>
                                <AlertDialogDescription>{u.email} nuk do të ketë më qasje në të dhënat e autoshkollës. Llogaria e tij nuk fshihet.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anulo</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeFromTenant(u.user_id, fullName || u.email)}>Hiqe</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === "candidates" && (
        <div className="glass-card rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr. Regj.</TableHead>
                <TableHead>Emri Mbiemri</TableHead>
                <TableHead>Numri Personal</TableHead>
                <TableHead>Email i Llogarisë</TableHead>
                <TableHead>Krijuar</TableHead>
                <TableHead className="text-right">Veprime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline" /></TableCell></TableRow>
              ) : candUsers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Asnjë kandidat me llogari aktive</TableCell></TableRow>
              ) : (
                candUsers.map((c) => (
                  <TableRow key={c.user_id}>
                    <TableCell className="font-mono text-sm">{c.numri_regjistrimit || "—"}</TableCell>
                    <TableCell className="font-medium">{c.emri} {c.mbiemri}</TableCell>
                    <TableCell className="text-muted-foreground">{c.numri_personal || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateDMY(c.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openPwReset(c)}>
                        <KeyRound className="w-4 h-4 mr-1" />Ndrro Fjalëkalimin
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit user dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifiko Përdoruesin</DialogTitle>
            <DialogDescription>{editTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-first">Emri</Label>
                <Input id="edit-first" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last">Mbiemri</Label>
                <Input id="edit-last" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pw">Fjalëkalimi i ri (opsional)</Label>
              <Input id="edit-pw" type="text" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Lëre bosh për të mos e ndryshuar" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>Anulo</Button>
            <Button onClick={handleEdit} disabled={editSaving}>
              {editSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Ruaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate password reset dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ndrro Fjalëkalimin</DialogTitle>
            <DialogDescription>
              {pwTarget ? `${pwTarget.emri} ${pwTarget.mbiemri} kyçet me numrin personal ${pwTarget.numri_personal || "—"}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pw-new">Fjalëkalimi i ri (min. 6 karaktere)</Label>
            <Input id="pw-new" type="text" value={pwValue} onChange={(e) => setPwValue(e.target.value)} placeholder="P.sh. 123456" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} disabled={pwSaving}>Anulo</Button>
            <Button onClick={handlePwReset} disabled={pwSaving}>
              {pwSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Ruaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
