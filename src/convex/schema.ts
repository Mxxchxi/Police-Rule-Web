import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // หมวดหมู่ของกฎ (TOFFEE POLICE DEPARTMENT RULE)
    categories: defineTable({
      name: v.string(),
      order: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_order", ["order"]),

    // เซสชันผู้ดูแลระบบ — สร้างตอน login (admin/88888888) และเช็คในทุก mutation ของแอดมิน
    sessions: defineTable({
      token: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
    }).index("by_token", ["token"]),

    // กฎแต่ละข้อ — อยู่ในหมวดหมู่เดียวเสมอ (relationship: Category 1 -> N Rules)
    rules: defineTable({
      categoryId: v.id("categories"),
      title: v.string(),
      description: v.optional(v.string()),
      fine: v.optional(v.string()),
      jailTime: v.optional(v.string()),
      communityService: v.optional(v.string()),
      note: v.optional(v.string()),
      order: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_category_order", ["categoryId", "order"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
