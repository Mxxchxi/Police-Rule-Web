import { AdminGuard } from "@/components/AdminGuard";
import { Button } from "@/components/ui/button";
import { RuleDialogs } from "@/components/rules/rule-dialogs";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { FolderOpen, FolderPlus, Pencil, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CategoryWithRules } from "@/hooks/use-rules";
import { useRulesData } from "@/hooks/use-rules";
import { useRuleManager } from "@/hooks/use-rule-manager";
import { DragHandle } from "@/components/rules/rule-details";

function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryWithRules;
  onEdit: (category: CategoryWithRules) => void;
  onDelete: (category: CategoryWithRules) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `cat:${category._id}`,
    data: { type: "category" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2.5 rounded-lg border bg-card px-3 py-3 sm:px-4 ${
        isDragging ? "z-10 border-primary/50 opacity-60" : "border-border"
      }`}
    >
      <DragHandle {...attributes} {...listeners} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 truncate text-[15px] font-semibold tracking-tight">
            {category.name}
          </h3>
          <span className="ml-auto shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {category.rules.length} กฎ
          </span>
        </div>

        {category.rules.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {category.rules.slice(0, 3).map((rule) => (
              <span
                key={rule._id}
                className="max-w-44 truncate rounded border border-border/70 bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground"
              >
                {rule.title}
              </span>
            ))}
            {category.rules.length > 3 && (
              <span className="text-xs text-muted-foreground">
                และอีก {category.rules.length - 3} รายการ
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(category)}
          aria-label={`แก้ไขหมวดหมู่ ${category.name}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(category)}
          aria-label={`ลบหมวดหมู่ ${category.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const data = useRulesData();
  const categories = data?.categories ?? [];
  const manager = useRuleManager(categories);
  const reorderCategories = useMutation(api.rules.reorderCategories);
  const { token } = useAuth();
  const adminToken = token ?? "";
  const [catIds, setCatIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // sync ลำดับหมวดหมู่จาก DB
  useEffect(() => {
    if (data) setCatIds(categories.map((c) => c._id));
  }, [data, categories]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const from = catIds.indexOf(String(active.id).replace("cat:", ""));
    const to = catIds.indexOf(String(over.id).replace("cat:", ""));
    if (from < 0 || to < 0 || from === to) return;
    const next = arrayMove(catIds, from, to);
    setCatIds(next);
    try {
      await reorderCategories({ token: adminToken, orderedIds: next.map((id) => id as Id<"categories">) });
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถจัดลำดับหมวดหมู่ได้", {
        description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  return (
    <AdminGuard>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
              <Shield className="size-3.5" />
              หมวดหมู่
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">จัดการหมวดหมู่</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ลากเพื่อเปลี่ยนลำดับหมวดหมู่ — ลำดับจะถูกบันทึกลงฐานข้อมูลอัตโนมัติ
            </p>
          </div>
          <Button
            onClick={() => manager.setCategoryForm({ initial: null })}
            className="gap-1.5 self-start sm:self-auto"
          >
            <FolderPlus className="size-4" />
            เพิ่มหมวดหมู่
          </Button>
        </header>

        {!data ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-muted/40" />
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={catIds.map((id) => `cat:${id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {catIds.map((categoryId) => {
                  const category = categories.find((c) => c._id === categoryId);
                  if (!category) return null;
                  return (
                    <SortableCategoryRow
                      key={categoryId}
                      category={category}
                      onEdit={(c) => manager.setCategoryForm({ initial: c })}
                      onDelete={(c) => manager.setDeleteCategory(c)}
                    />
                  );
                })}
                {categories.length === 0 && (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
                    <FolderOpen className="size-6 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      ยังไม่มีหมวดหมู่ — กด “เพิ่มหมวดหมู่” เพื่อเริ่มต้น
                    </p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <RuleDialogs manager={manager} categories={categories} />
      </div>
    </AdminGuard>
  );
}
