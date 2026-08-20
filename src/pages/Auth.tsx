import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, Shield, UserRound } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/manage") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("กรุณากรอก ID ผู้ดูแลระบบและรหัสผ่าน");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signIn(username.trim(), password);
      navigate(redirect);
    } catch (err) {
      console.error("Admin login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* พื้นหลัง */}
      <div className="bg-grid-faint pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% -5%, oklch(0.8 0.105 84 / 0.08), transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Auth Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="flex w-full flex-col items-center">
          <Card className="w-full max-w-[400px] border-border/70 bg-card/90 pb-0 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
            <CardHeader className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                <Shield className="size-6" />
              </div>
              <CardTitle className="text-xl tracking-tight">เข้าสู่ระบบผู้ดูแล</CardTitle>
              <CardDescription>
                สำหรับผู้ดูแลระบบ (Admin) เท่านั้น — กรอก ID และรหัสผ่าน
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="auth-username">ID ผู้ดูแลระบบ</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="auth-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      autoComplete="username"
                      className="pl-9"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="auth-password">รหัสผ่าน</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pl-9 pr-9"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  เข้าสู่ระบบ
                </Button>
                <Button asChild type="button" variant="ghost" className="w-full" disabled={isLoading}>
                  <Link to="/rules">กลับไปหน้ากฎทั้งหมด (ไม่ต้องเข้าสู่ระบบ)</Link>
                </Button>
              </CardFooter>
            </form>

            <div className="border-t border-border/60 bg-muted/30 px-6 py-3 text-center text-xs text-muted-foreground">
              Secured by{" "}
              <a
                href="https://freebuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-primary"
              >
                freebuff.com
              </a>
            </div>
          </Card>

          <p className="mt-5 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
            เว็บทั่วไปเปิดดูกฎได้ทันทีโดยไม่ต้องเข้าสู่ระบบ —
            ID และรหัสผ่านสำหรับผู้ดูแลระบบใช้สำหรับแก้ไข เพิ่ม หรือลบกฎเท่านั้น
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
