import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CategoryWithRules, RuleDoc } from "@/hooks/use-rules";
import { formatCommunityService, formatFine, formatJail } from "@/lib/rule-search";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Coins,
  FileText,
  FolderInput,
  GripVertical,
  Lock,
  HandHelping,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────
// แสดงรายละเอียดกฎ — แสดงเฉพาะข้อมูลที่มีเท่านั้น
// ─────────────────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="flex w-24 shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="min-w-0 flex-1 leading-relaxed text-foreground/90">{children}</span>
    </div>
  );
}

export function RuleDetails({
  rule,
  number,
}: {
  rule: RuleDoc;
  number: string;
}) {
  const fine = formatFine(rule.fine);
  const jail = formatJail(rule.jailTime);
  const communityService = formatCommunityService(rule.communityService);

  return (
    <div className="min-w-0 flex-1">
      <h4 className="flex flex-wrap items-baseline gap-x-2.5 text-[15px] font-semibold tracking-tight">
        <span className="font-mono text-[13px] font-medium text-primary/90">{number}</span>
        <span className="min-w-0 break-words">{rule.title}</span>
      </h4>

      {(fine || jail || communityService || rule.description || rule.note) && (
        <div className="mt-2.5 flex flex-col gap-1.5">
          {(fine || jail || communityService) && (
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-sm">
              {fine && (
                <span className="flex items-baseline gap-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Coins className="size-3.5" />
                    ค่าปรับ
                  </span>
                  <span className="font-medium">{fine}</span>
                </span>
              )}
              {jail && (
                <span className="flex items-baseline gap-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Lock className="size-3.5" />
                    จำคุก
                  </span>
                  <span className="font-medium">{jail}</span>
                </span>
              )}
              {communityService && (
                <span className="flex items-baseline gap-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <HandHelping className="size-3.5" />
                    บำเพ็ญ
                  </span>
                  <span className="font-medium">{communityService}</span>
                </span>
              )}
            </div>
          )}
          {rule.description && (
            <DetailRow icon={<FileText className="size-3.5" />} label="รายละเอียด">
              <span className="whitespace-pre-wrap">{rule.description}</span>
            </DetailRow>
          )}
          {rule.note && (
            <DetailRow icon={<AlertTriangle className="size-3.5 text-amber-400/80" />} label="หมายเหตุ">
              <span className="whitespace-pre-wrap">{rule.note}</span>
            </DetailRow>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ⋮ เมนูของกฎ (เฉพาะ Admin)
// ─────────────────────────────────────────────────────────────────────────

export function RuleMenu({
  rule,
  ruleCount,
  onEdit,
  onMove,
  onDelete,
  onReorder,
}: {
  rule: RuleDoc;
  ruleCount: number;
  onEdit: (rule: RuleDoc) => void;
  onMove: (rule: RuleDoc) => void;
  onDelete: (rule: RuleDoc) => void;
  onReorder: (rule: RuleDoc, direction: "up" | "down") => void;
}) {
  const ruleIndex = rule.order;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={`เมนูกฎ ${rule.title}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(rule)} className="cursor-pointer">
          <Pencil className="size-4" />
          แก้ไข
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(rule)} className="cursor-pointer">
          <FolderInput className="size-4" />
          ย้ายหมวดหมู่
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onReorder(rule, "up")}
          disabled={ruleIndex <= 0}
          className="cursor-pointer"
        >
          <ChevronUp className="size-4" />
          ย้ายขึ้น
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onReorder(rule, "down")}
          disabled={ruleIndex >= ruleCount - 1}
          className="cursor-pointer"
        >
          <ChevronDown className="size-4" />
          ย้ายลง
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(rule)}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          ลบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ⋮ เมนูของหมวดหมู่ (เฉพาะ Admin)
// ─────────────────────────────────────────────────────────────────────────

export function CategoryMenu({
  category,
  onEdit,
  onAddRule,
  onDelete,
}: {
  category: CategoryWithRules;
  onEdit: (category: CategoryWithRules) => void;
  onAddRule: (category: CategoryWithRules) => void;
  onDelete: (category: CategoryWithRules) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={`เมนูหมวดหมู่ ${category.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => onEdit(category)} className="cursor-pointer">
          <Pencil className="size-4" />
          แก้ไขหมวดหมู่
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddRule(category)} className="cursor-pointer">
          <Plus className="size-4" />
          เพิ่มกฎในหมวดหมู่นี้
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(category)}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          ลบหมวดหมู่
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ปุ่มลาก (drag handle) — ใช้กับหมวดหมู่และกฎ
// ─────────────────────────────────────────────────────────────────────────

export function DragHandle(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="touch-none shrink-0 cursor-grab rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
      aria-label="ลากเพื่อเปลี่ยนลำดับ"
      {...props}
    >
      <GripVertical className="size-4" />
    </button>
  );
}
