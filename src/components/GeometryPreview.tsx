'use client';

import { useRef, useEffect } from 'react';

interface GeometryPreviewProps {
  type: string;
  className?: string;
}

export default function GeometryPreview({ type, className = '' }: GeometryPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, 96, 96);

    const centerX = 48;
    const centerY = 48;

    // 设置颜色
    let color = '#808080';
    switch (type) {
      case 'plant':
        color = '#2d5a27';
        break;
      case 'fish':
        color = '#ff6b35';
        break;
      case 'sand':
        color = '#d4a574';
        break;
      case 'stone':
        color = '#808080';
        break;
      case 'wood':
        color = '#8b4513';
        break;
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;

    // 根据类型绘制不同的几何图形
    switch (type) {
      case 'plant': // 水草 - 画一个类似圆锥的三角形
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 35);
        ctx.lineTo(centerX - 25, centerY + 30);
        ctx.lineTo(centerX + 25, centerY + 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'fish': // 鱼 - 画一个椭圆形
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 35, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 鱼尾
        ctx.beginPath();
        ctx.moveTo(centerX + 35, centerY);
        ctx.lineTo(centerX + 45, centerY - 10);
        ctx.lineTo(centerX + 45, centerY + 10);
        ctx.closePath();
        ctx.fill();
        break;

      case 'sand': // 沙粒 - 画一个小八边形
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8 - Math.PI / 8;
          const x = centerX + Math.cos(angle) * 30;
          const y = centerY + Math.sin(angle) * 30;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'stone': // 石头 - 画一个二十面体简化版（不规则多边形）
        ctx.beginPath();
        ctx.moveTo(centerX - 30, centerY - 10);
        ctx.lineTo(centerX - 15, centerY - 30);
        ctx.lineTo(centerX + 25, centerY - 20);
        ctx.lineTo(centerX + 35, centerY + 10);
        ctx.lineTo(centerX + 15, centerY + 30);
        ctx.lineTo(centerX - 20, centerY + 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'wood': // 沉木 - 画一个长方形
        ctx.beginPath();
        ctx.roundRect(centerX - 15, centerY - 30, 30, 60, 3);
        ctx.fill();
        ctx.stroke();
        // 木纹纹理
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let i = -20; i <= 20; i += 8) {
          ctx.beginPath();
          ctx.moveTo(centerX - 12, centerY + i);
          ctx.lineTo(centerX + 12, centerY + i);
          ctx.stroke();
        }
        break;

      default: // 默认 - 立方体
        ctx.beginPath();
        ctx.rect(centerX - 25, centerY - 25, 50, 50);
        ctx.fill();
        ctx.stroke();
        break;
    }
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg ${className}`}
      width={96}
      height={96}
    />
  );
}
