import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useGuestView } from "@/hooks/use-guest-view";
import { useIsAdmin } from "@/hooks/use-rules";
import {
  BookOpen,
  DatabaseBackup,
  Eye,
  EyeOff,
  FolderOpen,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";

const NAV_ITEMS = [
  { to: "/dashboard", label: "หน้าหลัก", icon: Home, adminOnly: false, public: false },
  { to: "/rules", label: "กฎทั้งหมด", icon: BookOpen, adminOnly: false, public: true },
  { to: "/search", label: "ค้นหากฎ", icon: Search, adminOnly: false, public: false },
  { to: "/categories", label: "หมวดหมู่", icon: FolderOpen, adminOnly: true, public: false },
  { to: "/manage", label: "จัดการกฎ", icon: Settings, adminOnly: true, public: false },
  { to: "/backup", label: "Backup / Restore", icon: DatabaseBackup, adminOnly: true, public: false },
];

/** หน้าเฉพาะผู้ดูแล — ไม่อนุญาตให้เปิดในมุมมองผู้เยี่ยมชม */
const ADMIN_PATHS = ["/dashboard", "/categories", "/manage", "/backup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const { guestView, toggleGuestView, setGuestView } = useGuestView();
  const navigate = useNavigate();
  const location = useLocation();

  // ในมุมมองผู้เยี่ยมชม ไม่อนุญาตให้เปิดหน้าเฉพาะผู้ดูแล
  useEffect(() => {
    if (guestView && ADMIN_PATHS.includes(location.pathname)) {
      navigate("/rules", { replace: true });
    }
  }, [guestView, location.pathname, navigate]);

  const handleSignOut = async () => {
    setGuestView(false);
    await signOut();
    navigate("/rules");
  };

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (isAdmin && !guestView) return true;
    if (guestView || !isAuthenticated) return item.public;
    return !item.adminOnly;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          {/* ตราสัญลักษณ์ */}
          <NavLink to="/rules" className="flex shrink-0 items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
              <Shield className="size-4" />
            </span>
            <span className="hidden text-[13px] font-semibold tracking-[0.14em] text-foreground sm:block">
              PD RULE BY Yuu Walker
            </span>
            <span className="text-[12px] font-semibold tracking-[0.12em] text-foreground sm:hidden">
              PD RULE
            </span>
          </NavLink>

          {/* Nav — desktop */}
          <nav className="ml-3 hidden min-w-0 items-center gap-0 lg:flex">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-accent/70 text-foreground"
                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                  }`
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          {/* สถานะ + เมนูผู้ใช้ */}
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link
                  to={`/auth?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
                >
                  <LogIn className="size-3.5" />
                  เข้าสู่ระบบ
                </Link>
              </Button>
            ) : (
              <>
                {isAdmin ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleGuestView}
                    className="hidden shrink-0 gap-1.5 whitespace-nowrap px-2.5 text-xs sm:flex"
                  >
                    {guestView ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                    {guestView ? "กลับสู่โหมดผู้ดูแล" : "ดูมุมมองผู้เยี่ยมชม"}
                  </Button>
                ) : (
                  <span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground sm:flex">
                    ผู้ใช้งาน
                  </span>
                )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  <span className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-[11px] font-semibold uppercase text-foreground">
                    {(user?.name ?? "?").slice(0, 1)}
                  </span>
                  <span className="hidden max-w-32 truncate text-xs text-muted-foreground sm:block">
                    {user?.name ?? "ผู้ใช้"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user?.name ?? "ผู้ใช้งาน"}
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    บัญชีผู้ดูแลระบบ (Admin)
                  </p>
                </DropdownMenuLabel>
                {!guestView && (
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                    <LayoutDashboard className="size-4" />
                    หน้าหลัก
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Nav — mobile (scroll แนวนอน) */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/50 px-3 py-1.5 lg:hidden">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-accent/70 text-foreground"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                }`
              }
            >
              <item.icon className="size-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-border/50 py-5">
        <p className="mx-auto max-w-6xl px-4 text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 sm:px-6">
          PD RULE BY Yuu Walker — กฎระเบียบอย่างเป็นทางการ
        </p>
      </footer>
    </div>
  );
}
