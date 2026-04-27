'use client';

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, DragControls } from '@react-three/drei';
import * as THREE from 'three';

interface AquariumProps {
  width: number;
  height: number;
  depth: number;
  glassThickness?: number; // 玻璃厚度（厘米）
  waterLevel?: number; // 水面高度（米，相对于鱼缸底部）
  items?: Array<{
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    modelUrl: string;
    type: string;
  }>;
  onItemUpdate?: (itemId: string, updates: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  }) => void;
  onItemSelect?: (itemId: string) => void;
  onItemDelete?: (itemId: string) => void;
  selectedItemId?: string;
}

// 基础几何体渲染器（用于默认素材）
function GeometryRenderer({
  type,
  position,
  rotation,
  scale,
}: {
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 根据类型选择几何体和材质
  const geometry = useMemo(() => {
    switch (type) {
      case 'plant':
        // 水草：使用细长的圆锥体
        return new THREE.ConeGeometry(0.1, 0.5, 8);
      case 'fish':
        // 鱼：使用胶囊体
        return new THREE.CapsuleGeometry(0.1, 0.2, 4, 8);
      case 'sand':
        // 沙子：使用小八面体
        return new THREE.OctahedronGeometry(0.05);
      case 'stone':
        // 石头：使用二十面体，更加不规则
        return new THREE.IcosahedronGeometry(0.15, 0);
      case 'wood':
        // 沉木：使用圆柱体
        return new THREE.CylinderGeometry(0.1, 0.08, 0.4, 8);
      default:
        return new THREE.BoxGeometry(0.1, 0.1, 0.1);
    }
  }, [type]);

  const material = useMemo(() => {
    switch (type) {
      case 'plant':
        // 绿色半透明水草
        return new THREE.MeshPhysicalMaterial({
          color: 0x2d5a27,
          roughness: 0.6,
          metalness: 0.1,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
      case 'fish':
        // 彩色鱼
        return new THREE.MeshPhysicalMaterial({
          color: 0xff6b35,
          roughness: 0.3,
          metalness: 0.2,
        });
      case 'sand':
        // 沙子颜色
        return new THREE.MeshStandardMaterial({
          color: 0xd4a574,
          roughness: 0.9,
          metalness: 0.0,
        });
      case 'stone':
        // 石头灰色
        return new THREE.MeshStandardMaterial({
          color: 0x808080,
          roughness: 0.7,
          metalness: 0.1,
        });
      case 'wood':
        // 木头棕色
        return new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          roughness: 0.8,
          metalness: 0.0,
        });
      default:
        return new THREE.MeshStandardMaterial({ color: 0xffffff });
    }
  }, [type]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
    />
  );
}

// 3D模型加载组件
function ModelLoader({ url, onError }: { url: string; onError: () => void }) {
  const [error, setError] = useState(false);

  const gltf = useGLTF(url);

  useEffect(() => {
    if (gltf) {
      console.log('Model loaded successfully:', url);
    }
  }, [gltf, url]);

  // 如果useGLTF抛出错误，会被ErrorBoundary捕获
  // 我们通过检查gltf是否为undefined来检测加载失败
  if (!gltf) {
    return null;
  }

  return <primitive object={gltf.scene.clone()} />;
}

// 错误边界组件
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode; onError: () => void }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Model load error:', error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 3D模型组件
function ModelItem({
  modelUrl,
  position,
  rotation,
  scale,
  type,
  isSelected,
  onClick,
}: {
  modelUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  type: string;
  isSelected: boolean;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [loadError, setLoadError] = useState(false);

  // 如果是几何体URL或示例URL，使用几何体渲染
  const useGeometry = modelUrl.startsWith('geometry://') || modelUrl.includes('github.com/mrdoob/three.js/master/examples');

  // 如果URL是图片格式，显示错误
  const isImageUrl = modelUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);

  const handleLoadError = () => {
    console.error('Failed to load model:', modelUrl);
    setLoadError(true);
  };

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
    >
      {useGeometry ? (
        <GeometryRenderer type={type} position={[0, 0, 0]} rotation={[0, 0, 0]} scale={scale} />
      ) : isImageUrl || loadError ? (
        // 如果是图片或加载失败，显示占位符
        <GeometryRenderer type={type} position={[0, 0, 0]} rotation={[0, 0, 0]} scale={scale} />
      ) : (
        // 加载3D模型，添加错误处理
        <ErrorBoundary
          fallback={<GeometryRenderer type={type} position={[0, 0, 0]} rotation={[0, 0, 0]} scale={scale} />}
          onError={handleLoadError}
        >
          <Suspense fallback={<GeometryRenderer type={type} position={[0, 0, 0]} rotation={[0, 0, 0]} scale={scale} />}>
            <ModelLoader url={modelUrl} onError={handleLoadError} />
          </Suspense>
        </ErrorBoundary>
      )}
      {/* 选中时显示优雅的微光效果 */}
      {isSelected && (
        <group>
          {/* 微妙的边缘发光框 */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshBasicMaterial
              color={0xffffff}
              wireframe
              transparent
              opacity={0.2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Aquarium({ width, height, depth, glassThickness = 1, waterLevel = 0.8 }: Pick<AquariumProps, 'width' | 'height' | 'depth' | 'glassThickness' | 'waterLevel'>) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 玻璃厚度（将厘米转换为米）
  const thickness = glassThickness / 100;

  // 超白高透玻璃材质配置
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,        // 超白色
      metalness: 0,
      roughness: 0.02,        // 更光滑
      transmission: 1.0,     // 完全透光
      thickness: thickness,   // 玻璃厚度
      transparent: true,
      opacity: 0.15,          // 进一步降低不透明度，提高透视效果
      side: THREE.DoubleSide, // 双面渲染，更好的透视效果
      clearcoat: 1,          // 清漆层
      clearcoatRoughness: 0,
      ior: 1.52,             // 超白玻璃折射率
      reflectivity: 0.2,     // 降低反射率，减少反光遮挡视线
      sheen: 0.1,
      sheenColor: new THREE.Color(0xffffff),
    });
  }, [thickness]);

  // 水体材质 - 改进光影效果
  const waterMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x1a5276,       // 深蓝色水体
      transparent: true,
      opacity: 0.35,         // 降低不透明度，提高透视效果
      roughness: 0.05,       // 轻微粗糙，更真实
      metalness: 0.0,
      transmission: 0.95,   // 高透射，能够看到内部素材
      thickness: 2.0,        // 水体厚度
      ior: 1.33,             // 水的折射率
      clearcoat: 1,          // 清漆层
      clearcoatRoughness: 0.05,
      reflectivity: 0.3,    // 降低反射率，减少反射遮挡视线
      sheen: 0.2,
      sheenColor: new THREE.Color(0x3498db),
      envMapIntensity: 1.0,
    });
  }, []);

  // 水面顶部材质 - 用于顶部反射
  const waterSurfaceMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x2980b9,
      transparent: true,
      opacity: 0.25,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.9,
      thickness: 0.1,
      ior: 1.33,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      reflectivity: 0.4,    // 降低反射，提高透视
    });
  }, []);

  // 水面高度
  const waterHeight = waterLevel;
  const waterY = -height / 2 + waterHeight;

  // 底部平面
  const bottomGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(width, depth);
  }, [width, depth]);

  // 前面平面
  const frontGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(width, height);
  }, [width, height]);

  // 后面平面
  const backGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(width, height);
  }, [width, height]);

  // 左面平面
  const leftGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(depth, height);
  }, [depth, height]);

  // 右面平面
  const rightGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(depth, height);
  }, [depth, height]);

  // 水体几何体
  const waterGeometry = useMemo(() => {
    return new THREE.BoxGeometry(width - thickness, waterHeight, depth - thickness);
  }, [width, waterHeight, depth, thickness]);

  return (
    <group>
      {/* 底部玻璃 */}
      <mesh
        ref={meshRef}
        geometry={bottomGeometry}
        material={glassMaterial}
        position={[0, -height / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <lineSegments>
          <planeGeometry args={[width, depth]} />
          <lineBasicMaterial color={0x0077be} opacity={0.3} transparent />
        </lineSegments>
      </mesh>

      {/* 前面玻璃 */}
      <mesh
        geometry={frontGeometry}
        material={glassMaterial}
        position={[0, 0, depth / 2]}
        rotation={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        <lineSegments>
          <planeGeometry args={[width, height]} />
          <lineBasicMaterial color={0x0077be} opacity={0.3} transparent />
        </lineSegments>
      </mesh>

      {/* 后面玻璃 */}
      <mesh
        geometry={backGeometry}
        material={glassMaterial}
        position={[0, 0, -depth / 2]}
        rotation={[0, Math.PI, 0]}
        castShadow
        receiveShadow
      >
        <lineSegments>
          <planeGeometry args={[width, height]} />
          <lineBasicMaterial color={0x0077be} opacity={0.3} transparent />
        </lineSegments>
      </mesh>

      {/* 左面玻璃 */}
      <mesh
        geometry={leftGeometry}
        material={glassMaterial}
        position={[-width / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <lineSegments>
          <planeGeometry args={[depth, height]} />
          <lineBasicMaterial color={0x0077be} opacity={0.3} transparent />
        </lineSegments>
      </mesh>

      {/* 右面玻璃 */}
      <mesh
        geometry={rightGeometry}
        material={glassMaterial}
        position={[width / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <lineSegments>
          <planeGeometry args={[depth, height]} />
          <lineBasicMaterial color={0x0077be} opacity={0.3} transparent />
        </lineSegments>
      </mesh>

      {/* 水体 - 根据水面高度定位 */}
      <mesh
        geometry={waterGeometry}
        material={waterMaterial}
        position={[0, waterY - waterHeight / 2, 0]}
      />

      {/* 水面顶部 - 增加反射效果 */}
      <mesh
        geometry={new THREE.PlaneGeometry(width - thickness, depth - thickness)}
        material={waterSurfaceMaterial}
        position={[0, waterY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* 底部接触阴影 */}
      <ContactShadows
        position={[0, -height / 2 - 0.01, 0]}
        width={width * 1.5}
        height={depth * 1.5}
        far={2}
        blur={1}
        opacity={0.5}
      />
    </group>
  );
}

interface SceneProps extends AquariumProps {
  onItemSelect?: (itemId: string) => void;
  selectedItemId?: string;
}

function Scene({ width, height, depth, glassThickness, waterLevel, items = [], onItemUpdate, onItemSelect, selectedItemId }: SceneProps) {
  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.5} />

      {/* 主光源 */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* 补光 */}
      <pointLight position={[-5, 5, -5]} intensity={0.5} color={0x0088ff} />
      <pointLight position={[5, -5, 5]} intensity={0.3} color={0x0088ff} />

      {/* 鱼缸 - 先渲染鱼缸和水体 */}
      <Aquarium width={width} height={height} depth={depth} glassThickness={glassThickness} waterLevel={waterLevel} />

      {/* 鱼缸内的元素 */}
      {items.map((item) => (
        <group key={item.id}>
          <ModelItem
            modelUrl={item.modelUrl}
            position={item.position}
            rotation={item.rotation}
            scale={item.scale}
            type={item.type}
            isSelected={selectedItemId === item.id}
            onClick={() => onItemSelect && onItemSelect(item.id)}
          />
        </group>
      ))}

      {/* 环境反射 - 使用简单颜色背景 */}
      <color attach="background" args={['#ffffff']} />

      {/* 摄像机控制 - 当选中素材时禁用旋转和缩放，选中鱼缸时允许 */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={Math.max(width, height, depth)}
        maxDistance={Math.max(width, height, depth) * 3}
        enablePan={true}
        enableZoom={selectedItemId === 'aquarium' || !selectedItemId}  // 只选中素材时禁用缩放
        enableRotate={selectedItemId === 'aquarium' || !selectedItemId} // 只选中素材时禁用旋转
      />
    </>
  );
}

// 上下文菜单组件
function ContextMenu({ position, onClose, onDelete }: {
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48 z-50"
      style={{ left: position.x, top: position.y }}
    >
      <button
        onClick={onDelete}
        className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
      >
        删除素材
      </button>
    </div>
  );
}

export default function Aquarium3D({ width, height, depth, glassThickness, waterLevel, items = [], onItemUpdate, onItemSelect, onItemDelete, selectedItemId: propSelectedItemId }: AquariumProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuItemId, setContextMenuItemId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedItemId = propSelectedItemId;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // 计算鼠标位置
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // 点击空白处先关闭右键菜单，然后选中鱼缸
    if (e.target === e.currentTarget) {
      if (contextMenu) {
        setContextMenu(null);
      }
      onItemSelect?.('aquarium');
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    // 双击空白处选中鱼缸
    if (e.target === e.currentTarget) {
      if (contextMenu) {
        setContextMenu(null);
      }
      onItemSelect?.('aquarium');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // 删除快捷键
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
      onItemDelete?.(selectedItemId);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId]);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500">加载 3D 场景...</div>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative"
      suppressHydrationWarning
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <Canvas
        camera={{ position: [width * 1.5, height * 1.5, depth * 1.5], fov: 50 }}
        shadows
      >
        <Scene width={width} height={height} depth={depth} glassThickness={glassThickness} waterLevel={waterLevel} items={items} onItemUpdate={onItemUpdate} onItemSelect={onItemSelect} selectedItemId={selectedItemId} />
      </Canvas>

      {/* 右键菜单 - 只在选中素材时显示 */}
      {contextMenu && selectedItemId && selectedItemId !== 'aquarium' && (
        <ContextMenu
          position={contextMenu}
          onClose={() => {
            setContextMenu(null);
            setContextMenuItemId(null);
          }}
          onDelete={() => {
            if (selectedItemId) {
              onItemDelete?.(selectedItemId);
              setContextMenu(null);
            }
          }}
        />
      )}
    </div>
  );
}
