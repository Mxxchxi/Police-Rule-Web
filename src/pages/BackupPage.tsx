import { AdminGuard } from "@/components/AdminGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, CheckCircle2, Database, Download, FileUp, Shield } from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";

const BACKUP_FORMAT = "pd-rule-backup";
const BACKUP_VERSION = 1;

type BackupRule = {
  title: string;
  description?: string;
  fine?: string;
  jailTime?: string;
  communityService?: string;
  note?: string;
  order: number;
};

type BackupCategory = {
  name: string;
  order: number;
  rules: BackupRule[];
};

type BackupFile = {
  format: string;
  version: number;
  exportedAt?: number;
  categories: BackupCategory[];
};

function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<BackupFile>;
  if (data.format !== BACKUP_FORMAT || data.version !== BACKUP_VERSION) return false;
  if (!Array.isArray(data.categories)) return false;
  return data.categories.every(
    (category) =>
      category &&
      typeof category.name === "string" &&
      typeof category.order === "number" &&
      Array.isArray(category.rules) &&
      category.rules.every(
        (rule) =>
          rule &&
          typeof rule.title === "string" &&
          typeof rule.order === "number" &&
          (rule.description === undefined || typeof rule.description === "string") &&
          (rule.fine === undefined || typeof rule.fine === "string") &&
          (rule.jailTime === undefined || typeof rule.jailTime === "string") &&
          (rule.communityService === undefined || typeof rule.communityService === "string") &&
          (rule.note === undefined || typeof rule.note === "string"),
      ),
  );
}

export default function BackupPage() {
  const { token } = useAuth();
  const data = useQuery(api.rules.list);
  const exportBackup = useQuery(api.rules.exportRules, token ? { token } : "skip");
  const importRules = useMutation(api.rules.importRules);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const downloadBackup = () => {
    if (!exportBackup) {
      toast.error("ยังโหลดข้อมูล Backup ไม่เสร็จ");
      return;
    }

    const filenameDate = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(exportBackup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pd-rule-backup-${filenameDate}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success(
      `Export สำเร็จ — ${exportBackup.categories.length} หมวดหมู่ / ${exportBackup.categories.reduce((sum, category) => sum + category.rules.length, 0)} กฎ`,
    );
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("ไฟล์ไม่ใช่ JSON ที่ถูกต้อง");
      }

      if (!isBackupFile(parsed)) {
        throw new Error("ไฟล์ไม่ใช่ Backup ของ PD Rule v1 หรือโครงสร้างไฟล์ไม่ถูกต้อง");
      }

      const ruleCount = parsed.categories.reduce((sum, category) => sum + category.rules.length, 0);
      const confirmed = window.confirm(
        `การ Import จะลบกฎและหมวดหมู่ปัจจุบันทั้งหมด แล้วแทนที่ด้วยข้อมูลจากไฟล์นี้\n\n` +
          `หมวดหมู่: ${parsed.categories.length}\nกฎ: ${ruleCount}\n\n` +
          `แนะนำให้ Export ข้อมูลปัจจุบันเก็บไว้ก่อนดำเนินการ\n\nยืนยันการ Restore หรือไม่?`,
      );
      if (!confirmed) return;

      if (!token) throw new Error("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
      const result = await importRules({
        token,
        categories: parsed.categories,
      });

      toast.success(`Restore สำเร็จ — ${result.categoryCount} หมวดหมู่ / ${result.ruleCount} กฎ`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import ไม่สำเร็จ");
    } finally {
      setIsImporting(false);
    }
  };

  const currentRuleCount = data?.categories.reduce((sum, category) => sum + category.rules.length, 0) ?? 0;
  const currentCategoryCount = data?.categories.length ?? 0;

  return (
    <AdminGuard>
      <div className="flex flex-col gap-6">
        <header>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
            <Shield className="size-3.5" />
            Backup / Restore
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">สำรองและกู้คืนกฎ</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Export กฎออกเป็นไฟล์ JSON และ Import เพื่อกู้คืนข้อมูลกลับเข้าสู่ระบบ
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                <Download className="size-5" />
              </div>
              <CardTitle className="mt-2">Export กฎ</CardTitle>
              <CardDescription>
                ดาวน์โหลดหมวดหมู่และกฎทั้งหมดเป็นไฟล์ Backup สำหรับเก็บไว้หรือย้ายข้อมูล
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">หมวดหมู่ปัจจุบัน</span>
                  <span className="font-semibold">{currentCategoryCount}</span>
                </div>
                <div className="mt-1 flex justify-between gap-4">
                  <span className="text-muted-foreground">กฎปัจจุบัน</span>
                  <span className="font-semibold">{currentRuleCount}</span>
                </div>
              </div>
              <Button onClick={downloadBackup} disabled={!exportBackup} className="w-full gap-2">
                <Download className="size-4" />
                {exportBackup ? "ดาวน์โหลด Backup (.json)" : "กำลังเตรียมข้อมูล..."}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                <FileUp className="size-5" />
              </div>
              <CardTitle className="mt-2">Import / Restore กฎ</CardTitle>
              <CardDescription>
                นำไฟล์ Backup ของ PD Rule กลับเข้าระบบ โดยข้อมูลปัจจุบันจะถูกแทนที่ทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p className="text-muted-foreground">
                  Restore จะลบหมวดหมู่และกฎเดิมทั้งหมด แนะนำให้ Export ข้อมูลปัจจุบันก่อน
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImport}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full gap-2"
              >
                <FileUp className="size-4" />
                {isImporting ? "กำลัง Restore..." : "เลือกไฟล์ Backup (.json)"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4 text-primary" />
              รูปแบบ Backup
            </CardTitle>
            <CardDescription>
              ไฟล์จะเก็บเฉพาะข้อมูลหมวดหมู่และกฎ ไม่รวม Session หรือข้อมูล Login ของ Admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="font-medium">Format</p>
                <p className="mt-1 text-muted-foreground">PD Rule Backup</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="font-medium">Version</p>
                <p className="mt-1 text-muted-foreground">Backup v{BACKUP_VERSION}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="font-medium">ความปลอดภัย</p>
                <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  Admin เท่านั้น
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
