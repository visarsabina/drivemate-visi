import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, UserPlus, Loader2 } from "lucide-react";
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
  created_at: string;
  is_admin: boolean;
  is_instructor: boolean;
}

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "instructor" | "user">("admin");
  const [inviting, setInviting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_users_in_my_tenant");
    if (error) {
      toast.error("Gabim gjatë ngarkimit të përdoruesve: " + error.message);
    } else {
      setUsers((data as UserRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const grantAdmin = async (userId: string, email: string) => {
    setActionLoading(userId);
    const { error } = await supabase.rpc("grant_admin_role", { _target_user_id: userId });
    if (error) {
      toast.error("Gabim: " + error.message);
    } else {
      toast.success(`${email} është bërë admin`);
      await loadUsers();
    }
    setActionLoading(null);
  };

  const revokeAdmin = async (userId: string, email: string) => {
    setActionLoading(userId);
    const { error } = await supabase.rpc("revoke_admin_role", { _target_user_id: userId });
    if (error) {
      toast.error("Gabim: " + error.message);
    } else {
      toast.success(`Roli admin u hoq nga ${email}`);
      await loadUsers();
    }
    setActionLoading(null);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !invitePassword) {
      toast.error("Plotëso email dhe fjalëkalim");
      return;
    }
    if (invitePassword.length < 6) {
      toast.error("Fjalëkalimi duhet të ketë së paku 6 karaktere");
      return;
    }
    setInviting(true);

    const { data, error } = await supabase.functions.invoke(
      "admin-create-user-in-tenant",
      {
        body: {
          email: inviteEmail,
          password: invitePassword,
          role: inviteRole,
        },
      },
    );

    if (error || (data as { error?: string })?.error) {
      const msg = (data as { error?: string })?.error ?? error?.message ?? "Gabim";
      toast.error("Gabim: " + msg);
      setInviting(false);
      return;
    }

    const roleLabel =
      inviteRole === "admin" ? "admin" : inviteRole === "instructor" ? "instruktor" : "përdorues";
    toast.success(`Përdoruesi ${inviteEmail} u krijua si ${roleLabel}`);

    setInviteEmail("");
    setInvitePassword("");
    setInviteRole("admin");
    setInviteOpen(false);
    setInviting(false);
    await loadUsers();
  };

  const removeFromTenant = async (userId: string, email: string) => {
    setActionLoading(userId);
    const { error } = await supabase.rpc("remove_user_from_my_tenant", {
      _target_user_id: userId,
    });
    if (error) {
      toast.error("Gabim: " + error.message);
    } else {
      toast.success(`${email} u hoq nga autoshkolla`);
      await loadUsers();
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Përdoruesit</h2>
          <p className="text-sm text-muted-foreground">Menaxho qasjen admin për përdoruesit</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Shto Përdorues
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Shto Përdorues të Ri</DialogTitle>
              <DialogDescription>
                Krijo një llogari të re. Përdoruesi do të mund të hyjë me email-in dhe fjalëkalimin e dhënë.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-password">Fjalëkalimi (min. 6 karaktere)</Label>
                <Input
                  id="invite-password"
                  type="text"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Fjalëkalimi i përkohshëm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Roli</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "instructor" | "user")}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (qasje e plotë)</SelectItem>
                    <SelectItem value="instructor">Instruktor (vetëm kandidatët e tij)</SelectItem>
                    <SelectItem value="user">Përdorues (pa rol të caktuar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
                Anulo
              </Button>
              <Button onClick={handleInvite} disabled={inviting}>
                {inviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Krijo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Data e Regjistrimit</TableHead>
              <TableHead>Roli</TableHead>
              <TableHead className="text-right">Veprime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Asnjë përdorues
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isSelf = currentUser?.id === u.user_id;
                return (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">
                      {u.email}
                      {isSelf && <span className="text-xs text-muted-foreground ml-2">(ti)</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateDMY(u.created_at)}
                    </TableCell>
                    <TableCell>
                      {u.is_admin ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                          Admin
                        </Badge>
                      ) : u.is_instructor ? (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20" variant="outline">
                          Instruktor
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Përdorues
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {u.is_admin ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isSelf || actionLoading === u.user_id}
                              >
                                <ShieldOff className="w-4 h-4 mr-1" />
                                Hiq Admin
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hiqe rolin admin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {u.email} nuk do të ketë më qasje në panelin admin.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anulo</AlertDialogCancel>
                                <AlertDialogAction onClick={() => revokeAdmin(u.user_id, u.email)}>
                                  Hiqe
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => grantAdmin(u.user_id, u.email)}
                            disabled={actionLoading === u.user_id}
                          >
                            <ShieldCheck className="w-4 h-4 mr-1" />
                            Bëje Admin
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf || actionLoading === u.user_id}
                              className="text-destructive hover:text-destructive"
                            >
                              Hiq nga shkolla
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hiqe nga autoshkolla?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {u.email} nuk do të ketë më qasje në të dhënat e autoshkollës. Llogaria e tij nuk fshihet.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anulo</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeFromTenant(u.user_id, u.email)}>
                                Hiqe
                              </AlertDialogAction>
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
    </div>
  );
};

export default Users;
