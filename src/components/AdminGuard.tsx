import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useAuth } from "@/hooks/use-auth";
import { ADMIN_ROLE } from "@/hooks/use-rules";
import { Loader2, Lock } from "lucide-react";
import { Link } from "react-router";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.role !== ADMIN_ROLE) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Empty className="border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lock className="size-5" />
            </EmptyMedia>
            <EmptyTitle>เฉพาะผู้ดูแลระบบ</EmptyTitle>
            <EmptyDescription>
              หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น ผู้ใช้งานทั่วไปสามารถดูและค้นหากฎได้
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link to="/rules">กลับไปหน้ากฎทั้งหมด</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return children;
}
