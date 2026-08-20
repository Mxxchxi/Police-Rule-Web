import type { CategoryWithRules } from "@/hooks/use-rules";
import type { RuleManager } from "@/hooks/use-rule-manager";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryDialog, DeleteRuleDialog, MoveRuleDialog } from "./dialogs";
import { RuleFormDialog } from "./rule-form-dialog";

/**
 * เรนเดอร์ dialog ทั้งหมดของระบบกฎ ใช้ร่วมกันได้ทุกหน้า
 * โดยผูก state + handler จาก useRuleManager()
 */
export function RuleDialogs({
  manager,
  categories,
}: {
  manager: RuleManager;
  categories: CategoryWithRules[];
}) {
  return (
    <>
      <RuleFormDialog
        open={manager.ruleForm !== null}
        onOpenChange={(open) => {
          if (!open) manager.setRuleForm(null);
        }}
        categories={categories}
        initial={manager.ruleForm?.initial ?? null}
        defaultCategoryId={manager.ruleForm?.defaultCategoryId}
        saving={manager.busy}
        onSubmit={(values) => void manager.handleSaveRule(values)}
      />

      <CategoryFormDialog
        open={manager.categoryForm !== null}
        onOpenChange={(open) => {
          if (!open) manager.setCategoryForm(null);
        }}
        initial={manager.categoryForm?.initial ?? null}
        saving={manager.busy}
        onSubmit={(name) => void manager.handleSaveCategory(name)}
      />

      <MoveRuleDialog
        open={manager.moveRule !== null}
        onOpenChange={(open) => {
          if (!open) manager.setMoveRule(null);
        }}
        rule={manager.moveRule}
        categories={categories}
        saving={manager.busy}
        onConfirm={(categoryId) => void manager.handleMoveRule(categoryId)}
      />

      <DeleteRuleDialog
        open={manager.deleteRule !== null}
        onOpenChange={(open) => {
          if (!open) manager.setDeleteRule(null);
        }}
        rule={manager.deleteRule}
        saving={manager.busy}
        onConfirm={() => void manager.handleDeleteRule()}
      />

      <DeleteCategoryDialog
        open={manager.deleteCategory !== null}
        onOpenChange={(open) => {
          if (!open) manager.setDeleteCategory(null);
        }}
        category={manager.deleteCategory}
        categories={categories}
        saving={manager.busy}
        onConfirm={(payload) => void manager.handleDeleteCategory(payload)}
      />
    </>
  );
}
