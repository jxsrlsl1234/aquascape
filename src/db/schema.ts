import { pgTable, serial, text, integer, timestamp, real, jsonb, boolean } from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod';

// 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phone: text('phone').unique(), // 手机号
  wechatOpenId: text('wechat_open_id').unique(), // 微信OpenID
  wechatUnionId: text('wechat_union_id').unique(), // 微信UnionID
  nickname: text('nickname'), // 昵称
  avatar: text('avatar'), // 头像URL
  loginType: text('login_type').notNull(), // 登录类型：phone, wechat
  lastLoginAt: timestamp('last_login_at'), // 最后登录时间
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 管理员表
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  username: text('username').unique().notNull(), // 用户名
  password: text('password').notNull(), // 密码（hash）
  name: text('name'), // 姓名
  lastLoginAt: timestamp('last_login_at'), // 最后登录时间
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 登录记录表（用于统计活跃用户）
export const loginRecords = pgTable('login_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(), // 用户ID
  userType: text('user_type').notNull(), // 用户类型：user, admin
  loginTime: timestamp('login_time').defaultNow().notNull(),
  ip: text('ip'), // 登录IP
  device: text('device'), // 设备信息
});

// 首页配置表（用于存储首页图片等配置）
export const siteConfig = pgTable('site_config', {
  id: serial('id').primaryKey(),
  configKey: text('config_key').unique().notNull(), // 配置键
  configValue: text('config_value').notNull(), // 配置值
  description: text('description'), // 描述
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 素材表
export const materials = pgTable('materials', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // plant, fish, sand, stone, wood
  modelKey: text('model_key').notNull(), // 存储S3对象的key，而不是签名URL
  thumbnailUrl: text('thumbnail_url'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 鱼缸配置表
export const aquariums = pgTable('aquariums', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  depth: real('depth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 鱼缸内物品表
export const aquariumItems = pgTable('aquarium_items', {
  id: serial('id').primaryKey(),
  aquariumId: integer('aquarium_id').notNull(),
  materialId: integer('material_id').notNull(),
  positionX: real('position_x').default(0),
  positionY: real('position_y').default(0),
  positionZ: real('position_z').default(0),
  rotationX: real('rotation_x').default(0),
  rotationY: real('rotation_y').default(0),
  rotationZ: real('rotation_z').default(0),
  scaleX: real('scale_x').default(1),
  scaleY: real('scale_y').default(1),
  scaleZ: real('scale_z').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 项目版本表 - 用于保存项目快照
export const projectVersions = pgTable('project_versions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().default('未命名版本'),
  // 鱼缸配置
  length: real('length').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  glassThickness: real('glass_thickness').notNull(),
  waterLevel: real('water_level').notNull(),
  // 素材列表（JSON格式存储）
  items: jsonb('items').notNull().$type<Array<{
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    modelUrl: string;
    type: string;
    materialId: number;
  }>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 类型定义
export type MaterialType = 'plant' | 'fish' | 'sand' | 'stone' | 'wood';

// Zod schemas for validation
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Material schemas
export const insertMaterialSchema = createCoercedInsertSchema(materials).pick({
  name: true,
  type: true,
  modelKey: true,
  thumbnailUrl: true,
  description: true,
});

export const updateMaterialSchema = createCoercedInsertSchema(materials).pick({
  name: true,
  type: true,
  modelKey: true,
  thumbnailUrl: true,
  description: true,
}).partial();

// TypeScript types
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type UpdateMaterial = z.infer<typeof updateMaterialSchema>;
export type Aquarium = typeof aquariums.$inferSelect;
export type InsertAquarium = typeof aquariums.$inferInsert;
export type AquariumItem = typeof aquariumItems.$inferSelect;
export type InsertAquariumItem = typeof aquariumItems.$inferInsert;
export type ProjectVersion = typeof projectVersions.$inferSelect;
export type InsertProjectVersion = typeof projectVersions.$inferInsert;

// User types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;
export type LoginRecord = typeof loginRecords.$inferSelect;
export type InsertLoginRecord = typeof loginRecords.$inferInsert;
export type SiteConfig = typeof siteConfig.$inferSelect;
export type InsertSiteConfig = typeof siteConfig.$inferInsert;
