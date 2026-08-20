import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useMutation } from "convex/react";
import { FolderOpen, FolderPlus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CategoryWithRules, RuleDoc } from "@/hooks/use-rules";
import { ruleNumber } from "@/lib/rule-search";
import { CategoryMenu, DragHandle, RuleDetails, RuleMenu } from "./rule-details";

// ─────────────────────────────────────────────────────────────────────────
// id helper — prefix เพื่อป้องกัน id ซ้ำกันระหว่างหมวดหมู่กับกฎ
// ─────────────────────────────────────────────────────────────────────────

type DragId =
  | { kind: "rule"; rawId: string }
  | { kind: "category"; rawId: string }
  | { kind: "catdrop"; rawId: string };

function parseId(id: string | number): DragId | null {
  const s = String(id);
  if (s.startsWith("rule:")) return { kind: "rule", rawId: s.slice(5) };
  if (s.startsWith("catdrop:")) return { kind: "catdrop", rawId: s.slice(8) };
  if (s.startsWith("cat:")) return { kind: "category", rawId: s.slice(4) };
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Rule row (sortable)
// ─────────────────────────────────────────────────────────────────────────

function SortableRule({
  rule,
  number,
  isAdmin,
  ruleCount,
  onEdit,
  onMove,
  onDelete,
  onReorder,
}: {
  rule: RuleDoc;
  number: string;
  isAdmin: boolean;
  ruleCount: number;
  onEdit: (rule: RuleDoc) => void;
  onMove: (rule: RuleDoc) => void;
  onDelete: (rule: RuleDoc) => void;
  onReorder: (rule: RuleDoc, direction: "up" | "down") => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `rule:${rule._id}`,
    data: { type: "rule" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-start gap-2 px-4 py-3.5 transition-colors ${
        isDragging ? "z-10 bg-accent/60" : ""
      }`}
    >
      {isAdmin && <DragHandle {...attributes} {...listeners} className="mt-0.5" />}
      <RuleDetails rule={rule} number={number} />
      {isAdmin && (
        <RuleMenu
          rule={rule}
          ruleCount={ruleCount}
          onEdit={onEdit}
          onMove={onMove}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Category card (sortable + droppable สำหรับกฎจากหมวดหมู่อื่น)
// ─────────────────────────────────────────────────────────────────────────

function SortableCategory({
  category,
  isAdmin,
  isOver,
  onAddRule,
  onEditCategory,
  onDeleteCategory,
  onEditRule,
  onMoveRule,
  onDeleteRule,
  onReorderRule,
}: {
  category: CategoryWithRules;
  isAdmin: boolean;
  isOver: boolean;
  onAddRule: (categoryId: string) => void;
  onEditCategory: (category: CategoryWithRules) => void;
  onDeleteCategory: (category: CategoryWithRules) => void;
  onEditRule: (rule: RuleDoc) => void;
  onMoveRule: (rule: RuleDoc) => void;
  onDeleteRule: (rule: RuleDoc) => void;
  onReorderRule: (rule: RuleDoc, direction: "up" | "down") => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `cat:${category._id}`, data: { type: "category" } });
  const { setNodeRef: setDropRef } = useDroppable({ id: `catdrop:${category._id}` });

  const setRefs = (el: HTMLElement | null) => {
    setNodeRef(el);
    setDropRef(el);
  };

  return (
    <section
      ref={setRefs}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`overflow-hidden rounded-lg border bg-card transition-all ${
        isDragging ? "z-10 opacity-60" : ""
      } ${isOver ? "border-primary/60 ring-1 ring-primary/30" : "border-border"}`}
    >
      <header className="flex items-center gap-2 border-b border-border/70 px-3 py-2.5 sm:px-4">
        {isAdmin && <DragHandle {...attributes} {...listeners} />}
        <FolderOpen className="size-4 shrink-0 text-primary/80" />
        <h3 className="flex min-w-0 flex-1 items-baseline gap-2 text-[15px] font-semibold tracking-tight">
          <span className="min-w-0 truncate">{category.name}</span>
        </h3>
        <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {category.rules.length} กฎ
        </span>
        {isAdmin && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-xs"
            onClick={() => onAddRule(category._id)}
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">เพิ่มกฎ</span>
          </Button>
        )}
        {isAdmin && (
          <CategoryMenu
            category={category}
            onEdit={onEditCategory}
            onAddRule={() => onAddRule(category._id)}
            onDelete={onDeleteCategory}
          />
        )}
      </header>

      <div className="divide-y divide-border/60">
        {category.rules.length === 0 ? (
          <p className="px-4 py-4 text-center text-sm text-muted-foreground">
            ยังไม่มีกฎในหมวดหมู่นี้
            {isAdmin && " — กด “เพิ่มกฎ” เพื่อเพิ่ม"}
          </p>
        ) : (
          <SortableContext
            items={category.rules.map((rule) => `rule:${rule._id}`)}
            strategy={verticalListSortingStrategy}
          >
            {category.rules.map((rule, ruleIndex) => (
              <SortableRule
                key={rule._id}
                rule={rule}
                number={ruleNumber(ruleIndex)}
                isAdmin={isAdmin}
                ruleCount={category.rules.length}
                onEdit={onEditRule}
                onMove={onMoveRule}
                onDelete={onDeleteRule}
                onReorder={onReorderRule}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Board หลัก
// ─────────────────────────────────────────────────────────────────────────

export function RuleBoard({
  categories,
  isAdmin,
  interactive = true,
  onAddRule,
  onAddCategory,
  onEditRule,
  onEditCategory,
  onDeleteRule,
  onDeleteCategory,
  onMoveRule,
  onReorderRule,
}: {
  categories: CategoryWithRules[];
  isAdmin: boolean;
  /** ปิด Drag & Drop เมื่อกำลังกรอง/ค้นหา หรือผู้ใช้ไม่มีสิทธิ์ */
  interactive?: boolean;
  onAddRule: (categoryId: string) => void;
  onAddCategory: () => void;
  onEditRule: (rule: RuleDoc) => void;
  onEditCategory: (category: CategoryWithRules) => void;
  onDeleteRule: (rule: RuleDoc) => void;
  onDeleteCategory: (category: CategoryWithRules) => void;
  onMoveRule: (rule: RuleDoc) => void;
  onReorderRule: (rule: RuleDoc, direction: "up" | "down") => void;
}) {
  const reorderCategories = useMutation(api.rules.reorderCategories);
  const moveRule = useMutation(api.rules.moveRule);
  const { token } = useAuth();
  const adminToken = token ?? "";

  // ลำดับหมวดหมู่ + กฎ ณ ขณะลาก (มาจาก props แต่ปรับปรุงแบบ optimistic ขณะลาก)
  const [catIds, setCatIds] = useState<string[]>([]);
  const [ruleIdsByCat, setRuleIdsByCat] = useState<Record<string, string[]>>({});
  const [activeDrag, setActiveDrag] = useState<{ kind: "rule" | "category"; rawId: string } | null>(null);
  const [overCategoryId, setOverCategoryId] = useState<string | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (draggingRef.current) return;
    setCatIds(categories.map((c) => c._id));
    const next: Record<string, string[]> = {};
    for (const category of categories) next[category._id] = category.rules.map((r) => r._id);
    setRuleIdsByCat(next);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findRuleCategory = (rawRuleId: string): string | null => {
    for (const [categoryId, ids] of Object.entries(ruleIdsByCat)) {
      if (ids.includes(rawRuleId)) return categoryId;
    }
    return null;
  };

  const ruleById = (rawId: string): RuleDoc | undefined => {
    for (const category of categories) {
      const rule = category.rules.find((r) => r._id === rawId);
      if (rule) return rule;
    }
    return undefined;
  };
  const categoryById = (rawId: string): CategoryWithRules | undefined =>
    categories.find((c) => c._id === rawId);

  const handleDragStart = (event: DragStartEvent) => {
    const parsed = parseId(event.active.id);
    if (!parsed) return;
    draggingRef.current = true;
    if (parsed.kind === "rule") {
      setActiveDrag({ kind: "rule", rawId: parsed.rawId });
      const cat = findRuleCategory(parsed.rawId);
      if (cat) setOverCategoryId(cat);
    } else if (parsed.kind === "category") {
      setActiveDrag({ kind: "category", rawId: parsed.rawId });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeParsed = parseId(active.id);
    const overParsed = parseId(over.id);
    if (!activeParsed) return;

    // ── ลากหมวดหมู่: จัดลำดับหมวดหมู่ ──
    if (activeParsed.kind === "category") {
      if (overParsed?.kind === "category" && activeParsed.rawId !== overParsed.rawId) {
        setCatIds((prev) => {
          const from = prev.indexOf(activeParsed.rawId);
          const to = prev.indexOf(overParsed.rawId);
          if (from < 0 || to < 0 || from === to) return prev;
          return arrayMove(prev, from, to);
        });
      }
      return;
    }

    // ── ลากกฎ ──
    if (activeParsed.kind !== "rule") return;

    // หมวดหมู่ปลายทาง: ชี้ไปที่กฎตัวอื่น / พื้นที่หมวดหมู่ / การ์ดหมวดหมู่
    let overCat: string | null = null;
    if (overParsed?.kind === "rule") {
      overCat = findRuleCategory(overParsed.rawId);
    } else if (overParsed?.kind === "catdrop" || overParsed?.kind === "category") {
      overCat = overParsed.rawId;
    }
    if (!overCat) return;
    setOverCategoryId(overCat);

    // อ่านหมวดหมู่ต้นทางจาก state ล่าสุดภายใน updater เพื่อป้องกันข้อมูลซ้ำ
    setRuleIdsByCat((prev) => {
      let sourceCat: string | null = null;
      for (const [categoryId, ids] of Object.entries(prev)) {
        if (ids.includes(activeParsed.rawId)) {
          sourceCat = categoryId;
          break;
        }
      }
      if (!sourceCat) return prev;

      const fromList = prev[sourceCat] ?? [];
      const toList = prev[overCat] ?? [];

      if (sourceCat === overCat) {
        if (overParsed?.kind !== "rule") return prev;
        const from = fromList.indexOf(activeParsed.rawId);
        const to = toList.indexOf(overParsed.rawId);
        if (from < 0 || to < 0 || from === to) return prev;
        return { ...prev, [sourceCat]: arrayMove(fromList, from, to) };
      }

      // ข้ามหมวดหมู่
      const next = { ...prev };
      next[sourceCat] = fromList.filter((id) => id !== activeParsed.rawId);
      if (overParsed?.kind === "rule") {
        const insertAt = Math.max(0, toList.indexOf(overParsed.rawId));
        next[overCat] = [
          ...toList.slice(0, insertAt),
          activeParsed.rawId,
          ...toList.slice(insertAt).filter((id) => id !== activeParsed.rawId),
        ];
      } else {
        next[overCat] = [...toList.filter((id) => id !== activeParsed.rawId), activeParsed.rawId];
      }
      return next;
    });
  };

  // รีเซ็ต state การลากกลับให้ตรงกับข้อมูลจาก DB (ใช้เมื่อ drop ไม่สำเร็จ/ถูกยกเลิก)
  const resetFromProps = () => {
    setCatIds(categories.map((c) => c._id));
    const next: Record<string, string[]> = {};
    for (const category of categories) next[category._id] = category.rules.map((r) => r._id);
    setRuleIdsByCat(next);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const parsed = parseId(active.id);
    const overParsed = over ? parseId(over.id) : null;
    draggingRef.current = false;
    setActiveDrag(null);
    setOverCategoryId(null);

    if (!parsed) {
      resetFromProps();
      return;
    }

    try {
      if (parsed.kind === "category") {
        if (overParsed?.kind === "category" && parsed.rawId !== overParsed.rawId) {
          await reorderCategories({ token: adminToken, orderedIds: catIds.map((id) => id as Id<"categories">) });
        } else {
          resetFromProps();
        }
        return;
      }

      if (parsed.kind !== "rule" || !overParsed) {
        resetFromProps();
        return;
      }
      const fromCat = findRuleCategory(parsed.rawId);
      let toCat: string | null = null;
      if (overParsed.kind === "rule") toCat = findRuleCategory(overParsed.rawId);
      else if (overParsed.kind === "catdrop" || overParsed.kind === "category") toCat = overParsed.rawId;
      if (!fromCat || !toCat) {
        resetFromProps();
        return;
      }

      const list = ruleIdsByCat[toCat] ?? [];
      const toIndex = list.indexOf(parsed.rawId);
      await moveRule({
        token: adminToken,
        ruleId: parsed.rawId as Id<"rules">,
        toCategoryId: toCat as Id<"categories">,
        toIndex: toIndex < 0 ? 0 : toIndex,
      });
    } catch (error) {
      console.error(error);
      resetFromProps();
      toast.error("ไม่สามารถบันทึกการจัดลำดับได้", {
        description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  // ── ยังไม่มีหมวดหมู่เลย ──
  if (categories.length === 0) {
    return (
      <Empty className="border-border/60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpen className="size-5" />
          </EmptyMedia>
          <EmptyTitle>ยังไม่มีหมวดหมู่</EmptyTitle>
          <EmptyDescription>
            {isAdmin ? "กดปุ่ม “เพิ่มหมวดหมู่” เพื่อเริ่มต้นระบบ" : "รอให้ผู้ดูแลระบบเพิ่มหมวดหมู่"}
          </EmptyDescription>
        </EmptyHeader>
        {isAdmin && (
          <Button onClick={onAddCategory} className="gap-1.5">
            <FolderPlus className="size-4" />
            เพิ่มหมวดหมู่
          </Button>
        )}
      </Empty>
    );
  }

  // ── ถ้าไม่ใช่โหมดลาก ให้แสดงแบบธรรมดา ──
  if (!interactive) {
    return (
      <div className="flex flex-col gap-5">
        {categories.map((category) => (
          <section
            key={category._id}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <header className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5">
              <FolderOpen className="size-4 shrink-0 text-primary/80" />
              <h3 className="flex min-w-0 flex-1 items-baseline gap-2 text-[15px] font-semibold tracking-tight">
                <span className="min-w-0 truncate">{category.name}</span>
              </h3>
              <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {category.rules.length} กฎ
              </span>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 gap-1 px-2 text-xs"
                  onClick={() => onAddRule(category._id)}
                >
                  <Plus className="size-3.5" />
                  <span className="hidden sm:inline">เพิ่มกฎ</span>
                </Button>
              )}
            </header>
            <div className="divide-y divide-border/60">
              {category.rules.length === 0 ? (
                <p className="px-4 py-4 text-center text-sm text-muted-foreground">
                  ยังไม่มีกฎในหมวดหมู่นี้
                </p>
              ) : (
                category.rules.map((rule, ruleIndex) => (
                  <div key={rule._id} className="flex items-start gap-2 px-4 py-3.5">
                    <RuleDetails rule={rule} number={ruleNumber(ruleIndex)} />
                    {isAdmin && (
                      <RuleMenu
                        rule={rule}
                        ruleCount={category.rules.length}
                        onEdit={onEditRule}
                        onMove={onMoveRule}
                        onDelete={onDeleteRule}
                        onReorder={onReorderRule}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        ))}

        {categories.length === 0 && (
          <Empty className="border-border/60">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen className="size-5" />
              </EmptyMedia>
              <EmptyTitle>ยังไม่มีหมวดหมู่</EmptyTitle>
              <EmptyDescription>
                {isAdmin ? "กดปุ่ม “เพิ่มหมวดหมู่” เพื่อเริ่มต้นระบบ" : "รอให้ผู้ดูแลระบบเพิ่มหมวดหมู่"}
              </EmptyDescription>
            </EmptyHeader>
            {isAdmin && (
              <Button onClick={onAddCategory} className="gap-1.5">
                <FolderPlus className="size-4" />
                เพิ่มหมวดหมู่
              </Button>
            )}
          </Empty>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        draggingRef.current = false;
        setActiveDrag(null);
        setOverCategoryId(null);
        resetFromProps();
      }}
    >
      <SortableContext items={catIds.map((id) => `cat:${id}`)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-5">
          {catIds.map((categoryId) => {
            const category = categoryById(categoryId);
            if (!category) return null;
            return (
              <SortableCategory
                key={categoryId}
                category={category}
                isAdmin={isAdmin}
                isOver={overCategoryId === categoryId}
                onAddRule={onAddRule}
                onEditCategory={onEditCategory}
                onDeleteCategory={onDeleteCategory}
                onEditRule={onEditRule}
                onMoveRule={onMoveRule}
                onDeleteRule={onDeleteRule}
                onReorderRule={onReorderRule}
              />
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeDrag?.kind === "category" && categoryById(activeDrag.rawId) && (
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
            <FolderOpen className="size-4 text-primary/80" />
            <span className="text-sm font-semibold">{categoryById(activeDrag.rawId)?.name}</span>
          </div>
        )}
        {activeDrag?.kind === "rule" && ruleById(activeDrag.rawId) && (
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
            <RuleDetails rule={ruleById(activeDrag.rawId)!} number="••" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
