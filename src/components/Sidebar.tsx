import { Users, LayoutDashboard, UserPlus, CreditCard, LogOut, Wallet, Inbox, Car, Briefcase, IdCard, ShieldCheck, ClipboardCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Paneli", icon: LayoutDashboard },
  { id: "candidates", label: "Kandidatët", icon: Users },
  { id: "add", label: "Shto Kandidat", icon: UserPlus },
  { id: "payment", label: "Pagesa", icon: CreditCard },
  { id: "test", label: "Test Teorik", icon: ClipboardCheck },
  { id: "finances", label: "Financat", icon: Wallet },
  { id: "registrations", label: "Regjistrimet", icon: Inbox },
  { id: "vehicles", label: "Mjetet", icon: Car },
  { id: "employees", label: "Punëtorët", icon: Briefcase },
  { id: "licenses", label: "Licencat", icon: IdCard },
  { id: "users", label: "Përdoruesit", icon: ShieldCheck },
];

const AppSidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <aside className="w-64 h-screen bg-sidebar text-sidebar-foreground flex flex-col overflow-y-auto">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border shrink-0">
        <img src={logo} alt="Auto Shkolla Visi" width={40} height={40} />
        <div>
          <h1 className="text-lg font-bold text-sidebar-primary-foreground">Auto Shkolla</h1>
          <p className="text-xs text-sidebar-foreground/60">VISI</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3 shrink-0 bg-sidebar">
        {user?.email && (
          <div className="px-2 text-xs text-sidebar-foreground/70 truncate" title={user.email}>
            <span className="text-sidebar-foreground/50">I kyçur si:</span>
            <div className="font-medium text-sidebar-foreground truncate">{user.email}</div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Dilni
        </button>
        <p className="text-xs text-sidebar-foreground/40 text-center">© 2024 Auto Shkolla Visi</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
