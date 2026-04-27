import { NextResponse } from 'next/server';
import { materialManager } from '@/db/materialManager';

// 默认素材数据 - 使用Three.js几何体标记，前端将使用GeometryPreview渲染
// 这些素材不依赖外部3D模型，而是使用Three.js内置几何体
// 这样可以确保素材始终可用，且预览效果真实
const DEFAULT_MATERIALS = [
  // 水草类
  {
    name: '水草 - 苦草',
    type: 'plant',
    modelKey: 'geometry://cone-plant-1',
    thumbnailUrl: null,
    description: '常见的水草，适合装饰鱼缸底部',
  },
  {
    name: '水草 - 绿藻',
    type: 'plant',
    modelKey: 'geometry://cone-plant-2',
    thumbnailUrl: null,
    description: '漂浮水草，可以自由移动',
  },
  {
    name: '水草 - 莫斯',
    type: 'plant',
    modelKey: 'geometry://cone-plant-3',
    thumbnailUrl: null,
    description: '附着类水草，可以固定在石头上',
  },

  // 鱼类
  {
    name: '热带鱼 - 金鱼',
    type: 'fish',
    modelKey: 'geometry://capsule-fish-1',
    thumbnailUrl: null,
    description: '常见的观赏鱼类，色彩鲜艳',
  },
  {
    name: '热带鱼 - 孔雀鱼',
    type: 'fish',
    modelKey: 'geometry://capsule-fish-2',
    thumbnailUrl: null,
    description: '小型观赏鱼，适合群养',
  },
  {
    name: '热带鱼 - 斗鱼',
    type: 'fish',
    modelKey: 'geometry://capsule-fish-3',
    thumbnailUrl: null,
    description: '大型观赏鱼，适合单独饲养',
  },

  // 沙石类
  {
    name: '底砂 - 白色沙',
    type: 'sand',
    modelKey: 'geometry://octahedron-sand-1',
    thumbnailUrl: null,
    description: '白色细沙，营造清澈水质效果',
  },
  {
    name: '底砂 - 黑色沙',
    type: 'sand',
    modelKey: 'geometry://octahedron-sand-2',
    thumbnailUrl: null,
    description: '黑色细沙，对比强烈',
  },

  // 石头类
  {
    name: '装饰石 - 鹅卵石',
    type: 'stone',
    modelKey: 'geometry://icosahedron-stone-1',
    thumbnailUrl: null,
    description: '光滑的圆石，适合底部装饰',
  },
  {
    name: '装饰石 - 青石',
    type: 'stone',
    modelKey: 'geometry://icosahedron-stone-2',
    thumbnailUrl: null,
    description: '青色天然石，自然感强',
  },

  // 沉木类
  {
    name: '沉木 - 树枝',
    type: 'wood',
    modelKey: 'geometry://cylinder-wood-1',
    thumbnailUrl: null,
    description: '细长的树枝形状，适合小缸',
  },
  {
    name: '沉木 - 树干',
    type: 'wood',
    modelKey: 'geometry://cylinder-wood-2',
    thumbnailUrl: null,
    description: '粗壮的树干，适合大型鱼缸',
  },
  {
    name: '沉木 - 树根',
    type: 'wood',
    modelKey: 'geometry://cylinder-wood-3',
    thumbnailUrl: null,
    description: '复杂的树根结构，艺术感强',
  },
];

export async function POST() {
  try {
    const results = [];
    for (const material of DEFAULT_MATERIALS) {
      try {
        const created = await materialManager.createMaterial(material);
        results.push({ success: true, name: material.name, id: created.id });
      } catch (error: any) {
        // 如果素材已存在（唯一约束），跳过
        if (error.code === '23505') {
          results.push({ success: false, name: material.name, error: '已存在' });
        } else {
          results.push({ success: false, name: material.name, error: error.message });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      message: `成功插入 ${successCount}/${DEFAULT_MATERIALS.length} 个默认素材`,
      results,
    });
  } catch (error) {
    console.error('Error seeding materials:', error);
    return NextResponse.json(
      { error: 'Failed to seed materials' },
      { status: 500 }
    );
  }
}
