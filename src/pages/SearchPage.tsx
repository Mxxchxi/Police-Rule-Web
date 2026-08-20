import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RuleDialogs } from "@/components/rules/rule-dialogs";
import { RuleDetails, RuleMenu } from "@/components/rules/rule-details";
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
import { filterCategories, filterRulesFlat, ruleNumber } from "@/lib/rule-search";
import { FileSearch, FolderOpen, Search, Shield, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function SearchPage() {
  const data = useRulesData();
  const isAdmin = useIsAdmin();
  const { guestView } = useGuestView();
  const adminMode = isAdmin && !guestView;
  const [query, setQuery] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("all");

  const categories = data?.categories ?? [];
  const manager = useRuleManager(categories);

  const categoryResults = useMemo(
    () =>
      filterCategories(categories, {
        query,
        categoryId: filterCategoryId === "all" ? "" : filterCategoryId,
      }),
    [categories, query, filterCategoryId],
  );

  const categoryNameMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return categoryResults.filter((category) =>
      category.name.toLowerCase().includes(q),
    );
  }, [categoryResults, query]);

  const results = useMemo(
    () =>
      filterRulesFlat(categories, {
        query,
        categoryId: filterCategoryId === "all" ? "" : filterCategoryId,
      }),
    [categories, query, filterCategoryId],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
          <Shield className="size-3.5" />
          ค้นหากฎ
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">ค้นหาจากกฎทั้งหมด</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          ค้นหาจากหัวข้อกฎ รายละเอียด หมายเหตุ หรือชื่อหมวดหมู่
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหากฎ… เช่น อาวุธ, หลบหนี, ไซเรน"
            className="pl-9"
            autoFocus
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

      {!data ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <FileSearch className="size-8 text-muted-foreground/50" />
          <div>
            <p className="font-medium">ไม่พบกฎที่ค้นหา</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองหมวดหมู่
            </p>
          </div>
        </div>
      ) : categoryNameMatches.length > 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            พบหมวดหมู่ <span className="font-semibold text-foreground">{categoryNameMatches.length}</span> หมวด — แสดงกฎทั้งหมดภายในหมวดหมู่
          </p>
          {categoryNameMatches.map((category) => (
            <section
              key={category._id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                <FolderOpen className="size-4 shrink-0 text-primary/80" />
                <h2 className="font-semibold">{category.name}</h2>
                <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {category.rules.length} กฎ
                </span>
              </div>

              {category.rules.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  ยังไม่มีกฎในหมวดหมู่นี้
                </p>
              ) : (
                <div className="divide-y divide-border/60">
                  {category.rules.map((rule, ruleIndex) => (
                    <div key={rule._id} className="flex items-start gap-2 px-4 py-4">
                      <div className="min-w-0 flex-1">
                        <RuleDetails rule={rule} number={ruleNumber(ruleIndex)} />
                      </div>
                      {adminMode && (
                        <RuleMenu
                          rule={rule}
                          ruleCount={category.rules.length}
                          onEdit={(r) => manager.setRuleForm({ initial: r })}
                          onMove={(r) => manager.setMoveRule(r)}
                          onDelete={(r) => manager.setDeleteRule(r)}
                          onReorder={(r, direction) => void manager.handleReorderRule(r, direction)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
          {adminMode && (
            <p className="text-center text-xs text-muted-foreground">
              ใช้เมนู ⋮ ด้านขวาของแต่ละกฎเพื่อแก้ไข ย้าย หรือลบ
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            พบทั้งหมด <span className="font-semibold text-foreground">{results.length}</span> รายการ
          </p>
          <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border bg-card">
            {results.map(({ category, rule, ruleIndex }) => (
              <div key={rule._id} className="flex items-start gap-2 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FolderOpen className="size-3.5 shrink-0 text-primary/70" />
                    <span className="truncate">หมวดหมู่ {category.name}</span>
                  </p>
                  <RuleDetails rule={rule} number={ruleNumber(ruleIndex)} />
                </div>
                {adminMode && (
                  <RuleMenu
                    rule={rule}
                    ruleCount={category.rules.length}
                    onEdit={(r) => manager.setRuleForm({ initial: r })}
                    onMove={(r) => manager.setMoveRule(r)}
                    onDelete={(r) => manager.setDeleteRule(r)}
                    onReorder={(r, direction) => void manager.handleReorderRule(r, direction)}
                  />
                )}
              </div>
            ))}
          </div>
          {adminMode && (
            <p className="text-center text-xs text-muted-foreground">
              ใช้เมนู ⋮ ด้านขวาของแต่ละกฎเพื่อแก้ไข ย้าย หรือลบ
            </p>
          )}
        </div>
      )}

      <RuleDialogs manager={manager} categories={categories} />
    </div>
  );
}
