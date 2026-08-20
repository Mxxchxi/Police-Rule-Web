import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin, useStatsData } from "@/hooks/use-rules";
import { BookOpen, FolderOpen, Search, Settings, Shield, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const stats = useStatsData();
  const isAdmin = useIsAdmin();

  const maxCount = Math.max(1, ...(stats?.perCategory.map((c) => c.ruleCount) ?? [1]));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
            <Shield className="size-3.5" />
            หน้าหลัก
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            สรุปข้อมูลกฎระเบียบ
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            ข้อมูลอัปเดตแบบเรียลไทม์จากฐานข้อมูล
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1.5 self-start rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            โหมดผู้ดูแลระบบ — แก้ไขได้ทุกอย่าง
          </div>
        )}
      </header>

      {!stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-64 rounded-lg sm:col-span-2" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon={<FolderOpen className="size-4" />}
              label="จำนวนหมวดหมู่"
              value={`${stats.categoryCount}`}
              hint="หมวดหมู่ทั้งหมดในระบบ"
            />
            <StatCard
              icon={<BookOpen className="size-4" />}
              label="จำนวนกฎ"
              value={`${stats.ruleCount}`}
              hint="กฎทั้งหมดในระบบ"
            />
          </div>

          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">จำนวนกฎแยกตามหมวดหมู่</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {stats.perCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีหมวดหมู่ในระบบ</p>
              ) : (
                stats.perCategory.map((category) => (
                  <div key={category.categoryId} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium">{category.name}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {category.ruleCount} กฎ
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all duration-500"
                        style={{ width: `${(category.ruleCount / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-20 flex-col items-start gap-1 justify-center">
              <Link to="/rules">
                <span className="flex items-center gap-2 font-medium">
                  <BookOpen className="size-4 text-primary" />
                  กฎทั้งหมด
                </span>
                <span className="text-xs font-normal text-muted-foreground">ดูกฎแยกตามหมวดหมู่</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col items-start gap-1 justify-center">
              <Link to="/search">
                <span className="flex items-center gap-2 font-medium">
                  <Search className="size-4 text-primary" />
                  ค้นหากฎ
                </span>
                <span className="text-xs font-normal text-muted-foreground">ค้นหาและกรองตามหมวดหมู่</span>
              </Link>
            </Button>
            {isAdmin && (
              <Button asChild variant="outline" className="h-20 flex-col items-start gap-1 justify-center">
                <Link to="/categories">
                  <span className="flex items-center gap-2 font-medium">
                    <FolderOpen className="size-4 text-primary" />
                    จัดการหมวดหมู่
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">เพิ่ม / แก้ไข / จัดลำดับ</span>
                </Link>
              </Button>
            )}
            {isAdmin && (
              <Button asChild variant="outline" className="h-20 flex-col items-start gap-1 justify-center">
                <Link to="/manage">
                  <span className="flex items-center gap-2 font-medium">
                    <Settings className="size-4 text-primary" />
                    จัดการกฎ
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">เพิ่ม / แก้ไข / ลบกฎ</span>
                </Link>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
