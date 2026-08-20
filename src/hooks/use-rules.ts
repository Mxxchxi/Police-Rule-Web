import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import type { FunctionReturnType } from "convex/server";

/** ค่าคงที่ของบทบาท Admin (ตรงกับ ROLES.ADMIN ใน convex/schema.ts) */
export const ADMIN_ROLE = "admin";

type ListResult = FunctionReturnType<typeof api.rules.list>;

export type RuleDoc = ListResult["categories"][number]["rules"][number];

export type CategoryWithRules = ListResult["categories"][number];

/** Real-time data: categories (ordered) + rules (ordered). */
export function useRulesData() {
  return useQuery(api.rules.list);
}

export function useStatsData() {
  return useQuery(api.rules.stats);
}

export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === ADMIN_ROLE;
}
