import { eq, like, and, SQL } from 'drizzle-orm';
import { getDb } from 'coze-coding-dev-sdk';
import { materials, insertMaterialSchema, updateMaterialSchema } from './schema';
import type { Material, InsertMaterial, UpdateMaterial } from './schema';

export class MaterialManager {
  async createMaterial(data: InsertMaterial): Promise<Material> {
    const db = await getDb();
    const validated = insertMaterialSchema.parse(data);
    const [material] = await db.insert(materials).values(validated).returning();
    return material;
  }

  async getMaterials(options: {
    skip?: number;
    limit?: number;
    type?: string;
    search?: string;
  } = {}): Promise<Material[]> {
    const db = await getDb();
    const { skip = 0, limit = 100, type, search } = options;
    const conditions: SQL[] = [];

    if (type) {
      conditions.push(eq(materials.type, type));
    }

    if (search) {
      conditions.push(like(materials.name, `%${search}%`));
    }

    if (conditions.length > 0) {
      return db.select()
        .from(materials)
        .where(and(...conditions))
        .limit(limit)
        .offset(skip);
    }

    return db.select().from(materials).limit(limit).offset(skip);
  }

  async getMaterialById(id: number): Promise<Material | null> {
    const db = await getDb();
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material || null;
  }

  async updateMaterial(id: number, data: UpdateMaterial): Promise<Material | null> {
    const db = await getDb();
    const validated = updateMaterialSchema.parse(data);
    const [material] = await db
      .update(materials)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(materials.id, id))
      .returning();
    return material || null;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(materials).where(eq(materials.id, id));
    const rowCount = (result as any).rowCount;
    return (rowCount ?? 0) > 0;
  }
}

export const materialManager = new MaterialManager();

