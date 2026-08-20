import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
        <Shield className="size-6" />
      </div>
      <p className="mt-6 font-mono text-5xl font-bold tracking-tight text-foreground">404</p>
      <h1 className="mt-3 text-lg font-semibold tracking-tight">ไม่พบหน้าที่ค้นหา</h1>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        หน้าที่คุณกำลังค้นหาไม่มีอยู่ในระบบ หรือถูกย้ายไปแล้ว
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/">กลับไปหน้าหลัก</Link>
      </Button>
    </div>
  );
}
