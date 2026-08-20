import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import type { CategoryWithRules, RuleDoc } from "@/hooks/use-rules";
import type { RuleFormValues } from "@/components/rules/rule-form-dialog";

export interface RuleManager {
  busy: boolean;
  ruleForm: { initial: RuleDoc | null; defaultCategoryId?: string } | null;
  setRuleForm: (state: { initial: RuleDoc | null; defaultCategoryId?: string } | null) => void;
  categoryForm: { initial: CategoryWithRules | null } | null;
  setCategoryForm: (state: { initial: CategoryWithRules | null } | null) => void;
  deleteRule: RuleDoc | null;
  setDeleteRule: (rule: RuleDoc | null) => void;
  deleteCategory: CategoryWithRules | null;
  setDeleteCategory: (category: CategoryWithRules | null) => void;
  moveRule: RuleDoc | null;
  setMoveRule: (rule: RuleDoc | null) => void;
  handleSaveRule: (values: RuleFormValues) => Promise<void>;
  handleSaveCategory: (name: string) => Promise<void>;
  handleDeleteRule: () => Promise<void>;
  handleDeleteCategory: (payload: { moveRulesTo?: string }) => Promise<void>;
  handleMoveRule: (targetCategoryId: string) => Promise<void>;
  handleReorderRule: (rule: RuleDoc, direction: "up" | "down") => Promise<void>;
}

const empty = (value: string) => value.trim() || undefined;

export function useRuleManager(categories: CategoryWithRules[]): RuleManager {
  const { token } = useAuth();
  const adminToken = token ?? "";
  const [busy, setBusy] = useState(false);
  const [ruleForm, setRuleForm] = useState<{ initial: RuleDoc | null; defaultCategoryId?: string } | null>(null);
  const [categoryForm, setCategoryForm] = useState<{ initial: CategoryWithRules | null } | null>(null);
  const [deleteRule, setDeleteRule] = useState<RuleDoc | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<CategoryWithRules | null>(null);
  const [moveRule, setMoveRule] = useState<RuleDoc | null>(null);

  const addRule = useMutation(api.rules.addRule);
  const updateRule = useMutation(api.rules.updateRule);
  const deleteRuleM = useMutation(api.rules.deleteRule);
  const addCategory = useMutation(api.rules.addCategory);
  const updateCategory = useMutation(api.rules.updateCategory);
  const deleteCategoryM = useMutation(api.rules.deleteCategory);
  const moveRuleM = useMutation(api.rules.moveRule);

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveRule = (values: RuleFormValues) =>
    withBusy(async () => {
      const args = {
        categoryId: values.categoryId as Id<"categories">,
        title: values.title,
        description: empty(values.description),
        fine: empty(values.fine),
        jailTime: empty(values.jailTime),
        communityService: empty(values.communityService),
        note: empty(values.note),
      };
      try {
        if (ruleForm?.initial) {
          await updateRule({ token: adminToken, ruleId: ruleForm.initial._id, ...args });
          toast.success("บันทึกการแก้ไขแล้ว");
        } else {
          await addRule({ token: adminToken, ...args });
          toast.success("เพิ่มกฎแล้ว");
        }
        setRuleForm(null);
      } catch (error) {
        toast.error("ไม่สามารถบันทึกกฎได้", {
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        });
      }
    });

  const handleSaveCategory = (name: string) =>
    withBusy(async () => {
      try {
        if (categoryForm?.initial) {
          await updateCategory({ token: adminToken, categoryId: categoryForm.initial._id, name });
          toast.success("แก้ไขหมวดหมู่แล้ว");
        } else {
          await addCategory({ token: adminToken, name });
          toast.success("เพิ่มหมวดหมู่แล้ว");
        }
        setCategoryForm(null);
      } catch (error) {
        toast.error("ไม่สามารถบันทึกหมวดหมู่ได้", {
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        });
      }
    });

  const handleDeleteRule = () =>
    withBusy(async () => {
      if (!deleteRule) return;
      try {
        await deleteRuleM({ token: adminToken, ruleId: deleteRule._id });
        toast.success("ลบกฎแล้ว");
        setDeleteRule(null);
      } catch (error) {
        toast.error("ไม่สามารถลบกฎได้", {
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        });
      }
    });

  const handleDeleteCategory = (payload: { moveRulesTo?: string }) =>
    withBusy(async () => {
      if (!deleteCategory) return;
      try {
        await deleteCategoryM({
          token: adminToken,
          categoryId: deleteCategory._id,
          moveRulesTo: payload.moveRulesTo as Id<"categories"> | undefined,
        });
        toast.success("ลบหมวดหมู่แล้ว");
        setDeleteCategory(null);
      } catch (error) {
        toast.error("ไม่สามารถลบหมวดหมู่ได้", {
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        });
      }
    });

  const handleMoveRule = (targetCategoryId: string) =>
    withBusy(async () => {
      if (!moveRule) return;
      try {
        const target = categories.find((c) => c._id === targetCategoryId);
        await moveRuleM({
          token: adminToken,
          ruleId: moveRule._id,
          toCategoryId: targetCategoryId as Id<"categories">,
          toIndex: target?.rules.length ?? 0,
        });
        toast.success("ย้ายกฎแล้ว — ระบบจัดเลขใหม่ให้อัตโนมัติ");
        setMoveRule(null);
      } catch (error) {
        toast.error("ไม่สามารถย้ายกฎได้", {
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        });
      }
    });

  const handleReorderRule = (rule: RuleDoc, direction: "up" | "down") =>
    withBusy(async () => {
      try {
        await moveRuleM({
          token: adminToken,
          ruleId: rule._id,
          toCategoryId: rule.categoryId,
          toIndex: rule.order + (direction === "up" ? -1 : 1),
        });
      } catch (error) {
        toast.error("ไม่สามารถเปลี่ยนลำดับได้", {
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        });
      }
    });

  return {
    busy,
    ruleForm,
    setRuleForm,
    categoryForm,
    setCategoryForm,
    deleteRule,
    setDeleteRule,
    deleteCategory,
    setDeleteCategory,
    moveRule,
    setMoveRule,
    handleSaveRule,
    handleSaveCategory,
    handleDeleteRule,
    handleDeleteCategory,
    handleMoveRule,
    handleReorderRule,
  };
}
