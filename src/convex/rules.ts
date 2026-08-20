import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────
// Admin session — ผู้ใช้งาน 2 แบบ: เว็บทั่วไปดูได้ฟรี / แอดมินล็อกอิน
// ─────────────────────────────────────────────────────────────────────────

/** อายุของ session — 7 วัน */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function randomToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

async function getSession(ctx: QueryCtx | MutationCtx, token: string) {
  if (!token) return null;
  return await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
}

/** Throws unless the token belongs to a valid (unexpired) admin session. */
async function requireAdmin(ctx: MutationCtx, token: string) {
  const session = await getSession(ctx, token);
  if (!session) {
    throw new Error("กรุณาเข้าสู่ระบบในฐานะผู้ดูแลระบบ (Admin) ก่อน");
  }
  if (session.expiresAt < Date.now()) {
    throw new Error("เซสชันหมดอายุแล้ว — กรุณาเข้าสู่ระบบอีกครั้ง");
  }
  return session;
}

async function getSortedCategories(ctx: QueryCtx | MutationCtx) {
  const categories = await ctx.db.query("categories").collect();
  return categories.sort((a, b) => a.order - b.order);
}

async function getSortedRulesForCategory(ctx: QueryCtx | MutationCtx, categoryId: Id<"categories">) {
  const rules = await ctx.db
    .query("rules")
    .withIndex("by_category_order", (q) => q.eq("categoryId", categoryId))
    .collect();
  return rules.sort((a, b) => a.order - b.order);
}

/** Renumber rules in a category so order === position. Returns the updated list. */
async function renumberRules(ctx: MutationCtx, categoryId: Id<"categories">, now: number) {
  const rules = await getSortedRulesForCategory(ctx, categoryId);
  await Promise.all(
    rules.map((rule, index) => ctx.db.patch(rule._id, { order: index, updatedAt: now })),
  );
  return rules;
}

/** Renumber categories so order === position. */
async function renumberCategories(ctx: MutationCtx, now: number) {
  const categories = await getSortedCategories(ctx);
  await Promise.all(
    categories.map((category, index) =>
      ctx.db.patch(category._id, { order: index, updatedAt: now }),
    ),
  );
  return categories;
}

// ─────────────────────────────────────────────────────────────────────────
// Queries (public read — everyone can view rules)
// ─────────────────────────────────────────────────────────────────────────

/** Returns all categories (ordered) with their rules (ordered). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const categories = await getSortedCategories(ctx);
    const rules = await ctx.db.query("rules").collect();

    const rulesByCategory = new Map<string, typeof rules>();
    for (const rule of rules) {
      const bucket = rulesByCategory.get(rule.categoryId) ?? [];
      bucket.push(rule);
      rulesByCategory.set(rule.categoryId, bucket);
    }

    return {
      categories: categories.map((category) => ({
        ...category,
        rules: (rulesByCategory.get(category._id) ?? []).sort((a, b) => a.order - b.order),
      })),
    };
  },
});

/** Dashboard summary counts — real-time. */
/** Export a complete rule backup for the admin. */
export const exportRules = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await getSession(ctx, token);
    if (!session) throw new Error("กรุณาเข้าสู่ระบบในฐานะผู้ดูแลระบบ (Admin) ก่อน");
    if (session.expiresAt < Date.now()) {
      throw new Error("เซสชันหมดอายุแล้ว — กรุณาเข้าสู่ระบบอีกครั้ง");
    }

    const categories = await getSortedCategories(ctx);
    const rules = await ctx.db.query("rules").collect();
    const rulesByCategory = new Map<string, typeof rules>();
    for (const rule of rules) {
      const bucket = rulesByCategory.get(rule.categoryId) ?? [];
      bucket.push(rule);
      rulesByCategory.set(rule.categoryId, bucket);
    }

    return {
      format: "pd-rule-backup",
      version: 1,
      exportedAt: Date.now(),
      categories: categories.map((category) => ({
        name: category.name,
        order: category.order,
        rules: (rulesByCategory.get(category._id) ?? [])
          .sort((a, b) => a.order - b.order)
          .map((rule) => ({
            title: rule.title,
            description: rule.description,
            fine: rule.fine,
            jailTime: rule.jailTime,
            communityService: rule.communityService,
            note: rule.note,
            order: rule.order,
          })),
      })),
    };
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const categories = await getSortedCategories(ctx);
    const rules = await ctx.db.query("rules").collect();

    const perCategory = categories.map((category) => ({
      categoryId: category._id,
      name: category.name,
      ruleCount: rules.filter((rule) => rule.categoryId === category._id).length,
    }));

    return {
      categoryCount: categories.length,
      ruleCount: rules.length,
      perCategory,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Admin login — เข้าสู่ระบบด้วย ID admin / รหัสผ่าน (ค่าเริ่มต้น 88888888)
// ─────────────────────────────────────────────────────────────────────────

export const adminLogin = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const expectedUsername = process.env.ADMIN_USERNAME ?? "admin";
    const expectedPassword = process.env.ADMIN_PASSWORD ?? "88888888";
    if (username !== expectedUsername || password !== expectedPassword) {
      throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
    const token = randomToken();
    const now = Date.now();
    await ctx.db.insert("sessions", {
      token,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
    return { token };
  },
});

export const adminLogout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await getSession(ctx, token);
    if (session) await ctx.db.delete(session._id);
  },
});

/** ตรวจว่า token ยังใช้ได้หรือไม่ — ใช้ตอนเปิดเว็บเพื่อยืนยัน session */
export const me = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await getSession(ctx, token);
    if (!session || session.expiresAt < Date.now()) return null;
    return { name: "admin" };
  },
});

/**
 * Restore a complete backup. The current categories and rules are replaced
 * by the contents of the backup. IDs are intentionally regenerated so a
 * backup can be restored safely without depending on Convex document IDs.
 */
export const importRules = mutation({
  args: {
    token: v.string(),
    categories: v.array(
      v.object({
        name: v.string(),
        order: v.number(),
        rules: v.array(
          v.object({
            title: v.string(),
            description: v.optional(v.string()),
            fine: v.optional(v.string()),
            jailTime: v.optional(v.string()),
            communityService: v.optional(v.string()),
            note: v.optional(v.string()),
            order: v.number(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, { token, categories }) => {
    await requireAdmin(ctx, token);

    if (categories.length > 500) {
      throw new Error("ไฟล์ Backup มีจำนวนหมวดหมู่มากเกินไป (สูงสุด 500 หมวดหมู่)");
    }

    const totalRules = categories.reduce((sum, category) => sum + category.rules.length, 0);
    if (totalRules > 10000) {
      throw new Error("ไฟล์ Backup มีจำนวนกฎมากเกินไป (สูงสุด 10,000 กฎ)");
    }

    for (const category of categories) {
      if (!category.name.trim()) throw new Error("พบหมวดหมู่ที่ไม่มีชื่อ");
      for (const rule of category.rules) {
        if (!rule.title.trim()) throw new Error("พบกฎที่ไม่มีหัวข้อ");
      }
    }

    const existingRules = await ctx.db.query("rules").collect();
    const existingCategories = await ctx.db.query("categories").collect();

    // Delete children first because each rule references a category.
    await Promise.all(existingRules.map((rule) => ctx.db.delete(rule._id)));
    await Promise.all(existingCategories.map((category) => ctx.db.delete(category._id)));

    const now = Date.now();
    const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

    for (let categoryIndex = 0; categoryIndex < sortedCategories.length; categoryIndex += 1) {
      const sourceCategory = sortedCategories[categoryIndex];
      const categoryId = await ctx.db.insert("categories", {
        name: sourceCategory.name.trim(),
        order: categoryIndex,
        createdAt: now,
        updatedAt: now,
      });

      const sortedRules = [...sourceCategory.rules].sort((a, b) => a.order - b.order);
      for (let ruleIndex = 0; ruleIndex < sortedRules.length; ruleIndex += 1) {
        const sourceRule = sortedRules[ruleIndex];
        await ctx.db.insert("rules", {
          categoryId,
          title: sourceRule.title.trim(),
          description: sourceRule.description?.trim() || undefined,
          fine: sourceRule.fine,
          jailTime: sourceRule.jailTime,
          communityService: sourceRule.communityService,
          note: sourceRule.note?.trim() || undefined,
          order: ruleIndex,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { categoryCount: sortedCategories.length, ruleCount: totalRules };
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Categories (admin only)
// ─────────────────────────────────────────────────────────────────────────

export const addCategory = mutation({
  args: { token: v.string(), name: v.string() },
  handler: async (ctx, { token, name }) => {
    await requireAdmin(ctx, token);
    const trimmed = name.trim();
    if (!trimmed) throw new Error("กรุณากรอกชื่อหมวดหมู่");
    const categories = await getSortedCategories(ctx);
    const now = Date.now();
    return await ctx.db.insert("categories", {
      name: trimmed,
      order: categories.length,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCategory = mutation({
  args: { token: v.string(), categoryId: v.id("categories"), name: v.string() },
  handler: async (ctx, { token, categoryId, name }) => {
    await requireAdmin(ctx, token);
    const trimmed = name.trim();
    if (!trimmed) throw new Error("กรุณากรอกชื่อหมวดหมู่");
    const category = await ctx.db.get(categoryId);
    if (!category) throw new Error("ไม่พบหมวดหมู่นี้");
    await ctx.db.patch(categoryId, { name: trimmed, updatedAt: Date.now() });
  },
});

export const deleteCategory = mutation({
  args: {
    token: v.string(),
    categoryId: v.id("categories"),
    moveRulesTo: v.optional(v.id("categories")),
  },
  handler: async (ctx, { token, categoryId, moveRulesTo }) => {
    await requireAdmin(ctx, token);
    const category = await ctx.db.get(categoryId);
    if (!category) throw new Error("ไม่พบหมวดหมู่นี้");

    const now = Date.now();
    const rules = await getSortedRulesForCategory(ctx, categoryId);

    if (moveRulesTo && moveRulesTo !== categoryId) {
      // ย้ายกฎทั้งหมดไปยังหมวดหมู่อื่น (ต่อท้าย)
      const targetRules = await getSortedRulesForCategory(ctx, moveRulesTo);
      const startOrder = targetRules.length;
      await Promise.all(
        rules.map((rule, index) =>
          ctx.db.patch(rule._id, {
            categoryId: moveRulesTo,
            order: startOrder + index,
            updatedAt: now,
          }),
        ),
      );
    } else {
      // ลบกฎทั้งหมดในหมวดหมู่
      await Promise.all(rules.map((rule) => ctx.db.delete(rule._id)));
    }

    await ctx.db.delete(categoryId);
    await renumberCategories(ctx, now);
  },
});

/** รับรายการ id หมวดหมู่เรียงตามลำดับใหม่ที่ต้องการ */
export const reorderCategories = mutation({
  args: { token: v.string(), orderedIds: v.array(v.id("categories")) },
  handler: async (ctx, { token, orderedIds }) => {
    await requireAdmin(ctx, token);
    const now = Date.now();
    await Promise.all(
      orderedIds.map((categoryId, index) =>
        ctx.db.patch(categoryId, { order: index, updatedAt: now }),
      ),
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Rules (admin only)
// ─────────────────────────────────────────────────────────────────────────

export const addRule = mutation({
  args: {
    token: v.string(),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.optional(v.string()),
    fine: v.optional(v.string()),
    jailTime: v.optional(v.string()),
    communityService: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { token, categoryId, title, description, fine, jailTime, communityService, note }) => {
    await requireAdmin(ctx, token);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error("กรุณากรอกหัวข้อกฎ");
    const category = await ctx.db.get(categoryId);
    if (!category) throw new Error("ไม่พบหมวดหมู่นี้");

    const rules = await getSortedRulesForCategory(ctx, categoryId);
    const now = Date.now();
    return await ctx.db.insert("rules", {
      categoryId,
      title: trimmedTitle,
      description: description?.trim() || undefined,
      fine,
      jailTime,
      communityService,
      note: note?.trim() || undefined,
      order: rules.length,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateRule = mutation({
  args: {
    token: v.string(),
    ruleId: v.id("rules"),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.optional(v.string()),
    fine: v.optional(v.string()),
    jailTime: v.optional(v.string()),
    communityService: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { token, ruleId, categoryId, title, description, fine, jailTime, communityService, note }) => {
    await requireAdmin(ctx, token);
    const rule = await ctx.db.get(ruleId);
    if (!rule) throw new Error("ไม่พบกฎนี้");
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error("กรุณากรอกหัวข้อกฎ");
    const category = await ctx.db.get(categoryId);
    if (!category) throw new Error("ไม่พบหมวดหมู่นี้");

    await ctx.db.patch(ruleId, {
      categoryId,
      title: trimmedTitle,
      description: description?.trim() || undefined,
      fine,
      jailTime,
      communityService,
      note: note?.trim() || undefined,
      updatedAt: Date.now(),
    });

    // ถ้าเปลี่ยนหมวดหมู่ → ไปต่อท้ายหมวดหมู่ใหม่ และจัดลำดับหมวดหมู่เดิมใหม่
    if (rule.categoryId !== categoryId) {
      const now = Date.now();
      await renumberRules(ctx, rule.categoryId, now);
      const targetRules = await getSortedRulesForCategory(ctx, categoryId);
      await ctx.db.patch(ruleId, { order: targetRules.length, updatedAt: now });
    }
  },
});

export const deleteRule = mutation({
  args: { token: v.string(), ruleId: v.id("rules") },
  handler: async (ctx, { token, ruleId }) => {
    await requireAdmin(ctx, token);
    const rule = await ctx.db.get(ruleId);
    if (!rule) throw new Error("ไม่พบกฎนี้");
    const categoryId = rule.categoryId;
    await ctx.db.delete(ruleId);
    await renumberRules(ctx, categoryId, Date.now());
  },
});

/**
 * ย้ายกฎข้ามหมวดหมู่ หรือจัดลำดับภายในหมวดหมู่เดียวกัน
 * toIndex คือตำแหน่งปลายทาง (0-based) ในหมวดหมู่ปลายทาง
 */
export const moveRule = mutation({
  args: {
    token: v.string(),
    ruleId: v.id("rules"),
    toCategoryId: v.id("categories"),
    toIndex: v.number(),
  },
  handler: async (ctx, { token, ruleId, toCategoryId, toIndex }) => {
    await requireAdmin(ctx, token);
    const rule = await ctx.db.get(ruleId);
    if (!rule) throw new Error("ไม่พบกฎนี้");
    const category = await ctx.db.get(toCategoryId);
    if (!category) throw new Error("ไม่พบหมวดหมู่ปลายทาง");

    const now = Date.now();
    const fromCategoryId = rule.categoryId;
    const sourceRules = await getSortedRulesForCategory(ctx, fromCategoryId);
    const remaining = sourceRules.filter((r) => r._id !== ruleId);

    let targetRules: Awaited<ReturnType<typeof getSortedRulesForCategory>>;
    if (toCategoryId === fromCategoryId) {
      targetRules = remaining;
    } else {
      targetRules = await getSortedRulesForCategory(ctx, toCategoryId);
    }

    const clampedIndex = Math.max(0, Math.min(toIndex, targetRules.length));
    const newTarget = [
      ...targetRules.slice(0, clampedIndex),
      rule,
      ...targetRules.slice(clampedIndex),
    ];

    await Promise.all(
      newTarget.map((r, index) =>
        ctx.db.patch(r._id, { categoryId: toCategoryId, order: index, updatedAt: now }),
      ),
    );

    // ถ้าย้ายข้ามหมวดหมู่ ต้องจัดลำดับหมวดหมู่ต้นทางใหม่
    if (toCategoryId !== fromCategoryId) {
      await renumberRules(ctx, fromCategoryId, now);
    }
  },
});

/** รับรายการ id กฎเรียงตามลำดับใหม่ภายในหมวดหมู่เดียว */
export const reorderRules = mutation({
  args: { token: v.string(), categoryId: v.id("categories"), orderedIds: v.array(v.id("rules")) },
  handler: async (ctx, { token, categoryId, orderedIds }) => {
    await requireAdmin(ctx, token);
    const now = Date.now();
    await Promise.all(
      orderedIds.map((ruleId, index) =>
        ctx.db.patch(ruleId, { order: index, updatedAt: now }),
      ),
    );
  },
});
