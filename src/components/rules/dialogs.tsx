import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CategoryWithRules, RuleDoc } from "@/hooks/use-rules";
import { AlertTriangle, FolderInput, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// ย้ายกฎไปยังหมวดหมู่อื่น
// ─────────────────────────────────────────────────────────────────────────

export function MoveRuleDialog({
  open,
  onOpenChange,
  rule,
  categories,
  saving,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: RuleDoc | null;
  categories: CategoryWithRules[];
  saving: boolean;
  onConfirm: (categoryId: string) => void;
}) {
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTarget("");
  }, [open, rule]);

  const options = rule ? categories.filter((c) => c._id !== rule.categoryId) : [];

  const handleConfirm = () => {
    if (!target) {
      setError("กรุณาเลือกหมวดหมู่ปลายทาง");
      return;
    }
    onConfirm(target);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="size-4" />
            ย้ายหมวดหมู่
          </DialogTitle>
          <DialogDescription>
            {rule ? (
              <>
                ย้ายกฎ <span className="font-medium text-foreground">“{rule.title}”</span> ไปยังหมวดหมู่ใหม่
                (จะถูกจัดเลขใหม่ให้อัตโนมัติ)
              </>
            ) : (
              "เลือกหมวดหมู่ปลายทาง"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="move-target">หมวดหมู่ปลายทาง</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger id="move-target" className="w-full">
              <SelectValue placeholder="เลือกหมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              {options.map((category, index) => (
                <SelectItem key={category._id} value={category._id}>
                  {index + 1}. {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มีหมวดหมู่อื่นให้ย้ายไป</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            ยกเลิก
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={saving || options.length === 0}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            ย้ายกฎ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ยืนยันการลบกฎ
// ─────────────────────────────────────────────────────────────────────────

export function DeleteRuleDialog({
  open,
  onOpenChange,
  rule,
  saving,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: RuleDoc | null;
  saving: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            ลบกฎ
          </AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบกฎ{" "}
            <span className="font-medium text-foreground">“{rule?.title}”</span> หรือไม่?
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={saving}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            ลบกฎ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ยืนยันการลบหมวดหมู่ — เลือกได้ว่าจะลบกฎทั้งหมด หรือย้ายกฎไปหมวดหมู่อื่น
// ─────────────────────────────────────────────────────────────────────────

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  categories,
  saving,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryWithRules | null;
  categories: CategoryWithRules[];
  saving: boolean;
  onConfirm: (payload: { moveRulesTo?: string }) => void;
}) {
  const [mode, setMode] = useState<"deleteAll" | "move">("deleteAll");
  const [moveTarget, setMoveTarget] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode("deleteAll");
    setMoveTarget("");
  }, [open, category]);

  const ruleCount = category?.rules.length ?? 0;
  const otherCategories = category ? categories.filter((c) => c._id !== category._id) : [];

  const canConfirm = mode === "deleteAll" || Boolean(moveTarget);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            ลบหมวดหมู่
          </DialogTitle>
          <DialogDescription>
            คุณต้องการลบหมวดหมู่{" "}
            <span className="font-medium text-foreground">“{category?.name}”</span> หรือไม่?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            หมวดหมู่นี้มีกฎอยู่{" "}
            <span className="font-semibold text-foreground">{ruleCount}</span> รายการ
          </p>

          {ruleCount > 0 ? (
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "deleteAll" | "move")}>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="deleteAll" id="del-all" className="mt-0.5" />
                <Label htmlFor="del-all" className="font-normal leading-relaxed">
                  ลบหมวดหมู่และกฎทั้งหมด ({ruleCount} รายการ)
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="move" id="del-move" className="mt-0.5" />
                <Label htmlFor="del-move" className="font-normal leading-relaxed">
                  ย้ายกฎทั้งหมดไปหมวดหมู่อื่น
                </Label>
              </div>
            </RadioGroup>
          ) : (
            <p className="text-sm text-muted-foreground">หมวดหมู่นี้ไม่มีกฎอยู่</p>
          )}

          {mode === "move" && ruleCount > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="move-rules-target">ย้ายไปยังหมวดหมู่</Label>
              <Select value={moveTarget} onValueChange={setMoveTarget}>
                <SelectTrigger id="move-rules-target" className="w-full">
                  <SelectValue placeholder="เลือกหมวดหมู่ปลายทาง" />
                </SelectTrigger>
                <SelectContent>
                  {otherCategories.map((c, index) => (
                    <SelectItem key={c._id} value={c._id}>
                      {index + 1}. {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onConfirm(mode === "move" ? { moveRulesTo: moveTarget } : {})}
            disabled={saving || !canConfirm}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            ลบหมวดหมู่
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
