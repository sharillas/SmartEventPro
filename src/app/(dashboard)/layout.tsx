"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Package,
  Users,
  Briefcase,
  FileText,
  Wrench,
  Truck,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Receipt,
  Car,
  Building2,
  ChevronDown,
  ClipboardList,
  Shield,
  Award,
} from "lucide-react";
import { toast } from "sonner";

interface MenuGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "Logística",
    icon: Package,
    children: [
      { label: "Equipamentos", href: "/equipamentos", icon: Package },
      { label: "Reparações", href: "/reparacoes", icon: Wrench },
      { label: "Guias de Transporte", href: "/transportes", icon: Truck },
      { label: "Veículos", href: "/veiculos", icon: Car },
      { label: "Notas de Encomenda", href: "/notas-encomenda", icon: FileText },
    ],
  },
  {
    label: "Comercial",
    icon: Briefcase,
    children: [
      { label: "Orçamentos", href: "/orcamentos", icon: FileText },
      { label: "Clientes / Entidades", href: "/clientes", icon: Building2 },
      { label: "Faturação", href: "/faturas", icon: Receipt },
    ],
  },
  {
    label: "Recursos Humanos",
    icon: Users,
    children: [
      { label: "Colaboradores", href: "/rh", icon: UserCircle },
      { label: "Contratos", href: "/contratos", icon: FileText },
      { label: "EPIs", href: "/epis", icon: Shield },
      { label: "Certificações", href: "/certificacoes", icon: Award },
      { label: "Departamentos", href: "/departamentos", icon: Building2 },
      { label: "Cargos", href: "/funcoes", icon: ClipboardList },
      { label: "Veículos", href: "/veiculos-rh", icon: Car },
    ],
  },
  {
    label: "Financeiro",
    icon: Receipt,
    children: [
      { label: "Faturas", href: "/financeiro/faturas", icon: Receipt },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("sidebar-expanded");
    if (stored) setExpandedGroups(JSON.parse(stored));
    else setExpandedGroups(menuGroups.map((g) => g.label));
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else router.push("/login");
      });
  }, [router]);

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label];
      sessionStorage.setItem("sidebar-expanded", JSON.stringify(next));
      return next;
    });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Sessão terminada.");
    window.location.href = "/login";
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between h-14 px-4 border-b border-sidebar-border bg-sidebar">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-sidebar-foreground">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-bold text-lg text-sidebar-foreground flex items-center gap-2">
          <img src="/images/logo1.svg" alt="SmartEvent" className="h-7 w-7" />
          SmartEvent
        </span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">
            {user.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setSidebarOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-64 bg-sidebar flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              user={user}
              pathname={pathname}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent
          user={user}
          pathname={pathname}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

function SidebarContent({
  user,
  pathname,
  expandedGroups,
  onToggleGroup,
  onClose,
  onLogout,
}: {
  user: { name: string; email: string };
  pathname: string;
  expandedGroups: string[];
  onToggleGroup: (label: string) => void;
  onClose?: () => void;
  onLogout: () => void;
}) {
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const isGroupActive = (group: MenuGroup) =>
    group.children.some((item) => isActive(item.href));
  const isGroupExpanded = (label: string) => expandedGroups.includes(label);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
        <Link href="/" className="font-bold text-lg text-sidebar-foreground flex items-center gap-2">
          <img src="/images/logo1.svg" alt="SmartEvent" className="h-8 w-8" />
          SmartEvent
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-sidebar-foreground">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        {/* Dashboard */}
        <Link
          href="/"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2",
            isActive("/")
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <Separator className="my-3 bg-sidebar-border" />

        {/* Menu Groups */}
        <nav className="space-y-1">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <button
                onClick={() => onToggleGroup(group.label)}
                className={cn(
                  "flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                  isGroupActive(group)
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <group.icon className="h-4 w-4" />
                  {group.label}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isGroupExpanded(group.label) && "rotate-180"
                  )}
                />
              </button>

              {isGroupExpanded(group.label) && (
                <div className="ml-7 mt-1 space-y-1">
                  {group.children.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Definições */}
      <div className="px-3 py-2">
        <Link
          href="/definicoes"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            isActive("/definicoes")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <Settings className="h-4 w-4" />
          Definições / Admin
        </Link>
      </div>

      <Separator className="bg-sidebar-border" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Terminar Sessão
        </Button>
      </div>
    </div>
  );
}
