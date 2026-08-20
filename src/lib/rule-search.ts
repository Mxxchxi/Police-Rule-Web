import type { CategoryWithRules, RuleDoc } from "@/hooks/use-rules";

/** หมายเลขข้อย่อยของกฎ — เริ่มที่ 1 ในทุกหมวดหมู่ คำนวณจากตำแหน่ง ไม่ได้เก็บใน DB */
export function ruleNumber(ruleIndex: number) {
  return String(ruleIndex + 1);
}

const numberFormat = new Intl.NumberFormat("en-US");

/**
 * ถ้าค่าเป็นตัวเลข (หรือตัวเลขที่มีเครื่องหมายจุลภาค) → จัดรูปแบบพร้อมหน่วย
 * ถ้าเป็นข้อความอื่น (เช่น x10, x2) → แสดงตามที่กรอกแบบตรงตัว
 */
function parseNumeric(text: string): number | null {
  const cleaned = text.replace(/[, ]/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function formatFine(fine: string | number | undefined) {
  if (fine === undefined || fine === null) return null;
  const text = String(fine).trim();
  if (!text) return null;
  const numeric = parseNumeric(text);
  if (numeric !== null) return `${numberFormat.format(numeric)} IC`;
  return text;
}

export function formatJail(jailTime: string | number | undefined) {
  if (jailTime === undefined || jailTime === null) return null;
  const text = String(jailTime).trim();
  if (!text) return null;
  const numeric = parseNumeric(text);
  if (numeric !== null) return `${numberFormat.format(numeric)} นาที`;
  return text;
}

export function formatCommunityService(communityService: string | number | undefined) {
  if (communityService === undefined || communityService === null) return null;
  const text = String(communityService).trim();
  if (!text) return null;
  const numeric = parseNumeric(text);
  if (numeric !== null) return `${numberFormat.format(numeric)} ครั้ง`;
  return text;
}

export interface RuleFilter {
  query: string;
  categoryId: string; // "" = ทั้งหมด
}

/**
 * กรองหมวดหมู่/กฎจากคำค้นหา (หัวข้อ, รายละเอียด, หมายเหตุ, ชื่อหมวดหมู่)
 * และตัวกรองหมวดหมู่ หมวดหมู่ที่ไม่มีกฎตรงตามเงื่อนไขจะถูกตัดออก
 */
export function filterCategories(
  categories: CategoryWithRules[],
  filter: RuleFilter,
): CategoryWithRules[] {
  const q = filter.query.trim().toLowerCase();

  return categories
    .map((category, categoryIndex) => {
      if (filter.categoryId && category._id !== filter.categoryId) {
        return null;
      }
      if (!q) return category;

      const categoryMatch = category.name.toLowerCase().includes(q);
      const rules = category.rules.filter(
        (rule) =>
          rule.title.toLowerCase().includes(q) ||
          (rule.description ?? "").toLowerCase().includes(q) ||
          (rule.note ?? "").toLowerCase().includes(q) ||
          (rule.communityService ?? "").toLowerCase().includes(q),
      );
      // ถ้าไม่มีคำที่ค้นหาในหมวดหมู่นี้ ให้เก็บหมวดหมู่ไว้เฉพาะเมื่อชื่อหมวดหมู่ตรงกับคำค้น
      if (!categoryMatch && rules.length === 0) return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      void categoryIndex;
      return { ...category, rules };
    })
    .filter((c): c is CategoryWithRules => c !== null);
}

/** กฎทั้งหมด (แบบ flat) หลังกรอง — ใช้ในหน้าค้นหา */
export function filterRulesFlat(
  categories: CategoryWithRules[],
  filter: RuleFilter,
): { category: CategoryWithRules; rule: RuleDoc; categoryIndex: number; ruleIndex: number }[] {
  const result: { category: CategoryWithRules; rule: RuleDoc; categoryIndex: number; ruleIndex: number }[] = [];
  filterCategories(categories, filter).forEach((category, categoryIndex) => {
    category.rules.forEach((rule, ruleIndex) => {
      result.push({ category, rule, categoryIndex, ruleIndex });
    });
  });
  return result;
}

export function matchesAnyRule(category: CategoryWithRules, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return category.rules.some(
    (rule) =>
      rule.title.toLowerCase().includes(q) ||
      (rule.description ?? "").toLowerCase().includes(q) ||
      (rule.note ?? "").toLowerCase().includes(q) ||
      (rule.communityService ?? "").toLowerCase().includes(q),
  );
}
