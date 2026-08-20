import { AdminGuard } from "@/components/AdminGuard";
import { Button } from "@/components/ui/button";
import { RuleDialogs } from "@/components/rules/rule-dialogs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRulesData } from "@/hooks/use-rules";
import { useRuleManager } from "@/hooks/use-rule-manager";
import { formatCommunityService, formatFine, formatJail, ruleNumber } from "@/lib/rule-search";
import { FolderInput, Pencil, Plus, Shield, Trash2 } from "lucide-react";

export default function ManagePage() {
  const data = useRulesData();
  const categories = data?.categories ?? [];
  const manager = useRuleManager(categories);

  const rows = categories.flatMap((category) =>
    category.rules.map((rule, ruleIndex) => ({
      category,
      rule,
      number: ruleNumber(ruleIndex),
    })),
  );

  return (
    <AdminGuard>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
              <Shield className="size-3.5" />
              จัดการกฎ
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">จัดการกฎทั้งหมด</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              เพิ่ม แก้ไข ย้ายหมวดหมู่ และลบกฎได้จากหน้านี้
            </p>
          </div>
          <Button
            onClick={() => manager.setRuleForm({ initial: null })}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            เพิ่มกฎ
          </Button>
        </header>

        {!data ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg border border-border bg-muted/40" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">
              ยังไม่มีกฎในระบบ — กด “เพิ่มกฎ” เพื่อเริ่มต้น
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16">หมายเลข</TableHead>
                  <TableHead>หัวข้อกฎ</TableHead>
                  <TableHead className="min-w-36">หมวดหมู่</TableHead>
                  <TableHead className="w-24">ค่าปรับ</TableHead>
                  <TableHead className="w-24">จำคุก</TableHead>
                  <TableHead className="w-24">บำเพ็ญ(ครั้ง)</TableHead>
                  <TableHead className="w-36 text-right">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ rule, category, number }) => (
                  <TableRow key={rule._id}>
                    <TableCell className="font-mono text-[13px] text-primary/90">
                      {number}
                    </TableCell>
                    <TableCell className="max-w-56 truncate font-medium" title={rule.title}>
                      {rule.title}
                    </TableCell>
                    <TableCell className="min-w-36 truncate text-muted-foreground">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFine(rule.fine) ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatJail(rule.jailTime) ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCommunityService(rule.communityService) ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => manager.setRuleForm({ initial: rule })}
                          aria-label={`แก้ไขกฎ ${rule.title}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => manager.setMoveRule(rule)}
                          aria-label={`ย้ายกฎ ${rule.title}`}
                        >
                          <FolderInput className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => manager.setDeleteRule(rule)}
                          aria-label={`ลบกฎ ${rule.title}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <RuleDialogs manager={manager} categories={categories} />
      </div>
    </AdminGuard>
  );
}
