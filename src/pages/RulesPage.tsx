import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RuleBoard } from "@/components/rules/rule-board";
import { RuleDialogs } from "@/components/rules/rule-dialogs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGuestView } from "@/hooks/use-guest-view";
import { useIsAdmin, useRulesData } from "@/hooks/use-rules";
import { useRuleManager } from "@/hooks/use-rule-manager";
import { filterCategories } from "@/lib/rule-search";
import { FolderPlus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function RulesPage() {
  const data = useRulesData();
  const isAdmin = useIsAdmin();
  const { guestView } = useGuestView();
  const adminMode = isAdmin && !guestView;
  const [query, setQuery] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("all");

  const categories = data?.categories ?? [];
  const manager = useRuleManager(categories);

  const hasFilter = query.trim().length > 0 || filterCategoryId !== "all";
  const filtered = useMemo(
    () =>
      filterCategories(categories, {
        query,
        categoryId: filterCategoryId === "all" ? "" : filterCategoryId,
      }),
    [categories, query, filterCategoryId],
  );

  const resultCount = filtered.reduce((sum, c) => sum + c.rules.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            กฎระเบียบของหน่วยงาน
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {guestView
              ? "กำลังดูในมุมมองผู้เยี่ยมชม — กด “กลับโหมดผู้ดูแล” ที่แถบด้านบนเพื่อแก้ไขข้อมูล"
              : isAdmin
                ? "ลากหมวดหมู่หรือกฎเพื่อจัดลำดับ — ลากกฎลงบนหมวดหมู่อื่นเพื่อย้าย"
                : "โหมดอ่านอย่างเดียว — เข้าสู่ระบบในฐานะผู้ดูแลระบบเพื่อแก้ไขข้อมูล"}
          </p>
        </div>
        {adminMode && (
          <Button
            onClick={() => manager.setCategoryForm({ initial: null })}
            className="gap-1.5 self-start sm:self-auto"
          >
            <FolderPlus className="size-4" />
            เพิ่มหมวดหมู่
          </Button>
        )}
      </header>

      {/* ค้นหา + กรอง */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหากฎ… (หัวข้อ รายละเอียด หมายเหตุ หมวดหมู่)"
            className="pl-9"
            aria-label="ค้นหากฎ"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="ล้างคำค้นหา"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
          <SelectTrigger className="w-full sm:w-56" aria-label="กรองตามหมวดหมู่">
            <SelectValue placeholder="ทุกหมวดหมู่" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilter && (
        <p className="text-sm text-muted-foreground">
          พบ <span className="font-semibold text-foreground">{resultCount}</span> รายการ
          {query.trim() && (
            <>
              {" "}
              จากคำค้นหา <span className="font-semibold text-foreground">“{query.trim()}”</span>
            </>
          )}
          {filterCategoryId && (
            <>
              {" "}
              ในหมวดหมู่{" "}
              <span className="font-semibold text-foreground">
                {categories.find((c) => c._id === filterCategoryId)?.name}
              </span>
            </>
          )}
        </p>
      )}

      {!data ? (
        <div className="flex flex-col gap-5">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      ) : (
        <RuleBoard
          categories={filtered}
          isAdmin={adminMode}
          interactive={adminMode && !hasFilter}
          onAddRule={(categoryId) => manager.setRuleForm({ initial: null, defaultCategoryId: categoryId })}
          onAddCategory={() => manager.setCategoryForm({ initial: null })}
          onEditRule={(rule) => manager.setRuleForm({ initial: rule })}
          onEditCategory={(category) => manager.setCategoryForm({ initial: category })}
          onDeleteRule={(rule) => manager.setDeleteRule(rule)}
          onDeleteCategory={(category) => manager.setDeleteCategory(category)}
          onMoveRule={(rule) => manager.setMoveRule(rule)}
          onReorderRule={(rule, direction) => void manager.handleReorderRule(rule, direction)}
        />
      )}

      <RuleDialogs manager={manager} categories={categories} />
    </div>
  );
}
