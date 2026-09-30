import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';

export interface InfiniteMenuItem {
  image: string;
  link?: string;
  title: string;
  description?: string;
}

interface InfiniteMenuProps {
  items: InfiniteMenuItem[];
  scale?: number;
  autoSpeed?: number;
  className?: string;
}

export const InfiniteMenu: React.FC<InfiniteMenuProps> = ({
  items,
  scale = 1.8,
  autoSpeed = 0.6,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Animation state references
  const stateRef = useRef({
    progress: 0,
    targetProgress: 0,
    velocity: autoSpeed,
    images: [] as HTMLImageElement[],
    loaded: false,
    itemCount: items.length,
    animId: 0,
  });

  useEffect(() => {
    stateRef.current.itemCount = items.length;
  }, [items]);

  // Preload images
  useEffect(() => {
    let active = true;
    const loadedImages: HTMLImageElement[] = [];
    let loadCount = 0;

    items.forEach((item, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = item.image;
      img.onload = () => {
        if (!active) return;
        loadedImages[index] = img;
        loadCount++;
        if (loadCount >= items.length) {
          stateRef.current.images = loadedImages;
          stateRef.current.loaded = true;
        }
      };
      img.onerror = () => {
        if (!active) return;
        // Fallback placeholder image canvas
        const fbCanvas = document.createElement('canvas');
        fbCanvas.width = 400;
        fbCanvas.height = 400;
        const ctx = fbCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(0, 0, 400, 400);
          ctx.fillStyle = '#6366f1';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.title || 'Security Module', 200, 200);
        }
        const fbImg = new Image();
        fbImg.src = fbCanvas.toDataURL();
        loadedImages[index] = fbImg;
        loadCount++;
        if (loadCount >= items.length) {
          stateRef.current.images = loadedImages;
          stateRef.current.loaded = true;
        }
      };
    });

    return () => {
      active = false;
    };
  }, [items]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = container.clientWidth * window.devicePixelRatio);
    let height = (canvas.height = container.clientHeight * window.devicePixelRatio);

    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.clientWidth * window.devicePixelRatio;
      height = canvas.height = container.clientHeight * window.devicePixelRatio;
    };

    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Continuous automatic motion
      const currentSpeed = isHovered ? autoSpeed * 0.4 : autoSpeed;
      stateRef.current.progress += currentSpeed * dt * 0.45;

      const progress = stateRef.current.progress;
      const numItems = items.length;
      if (numItems === 0) return;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Center coordinates
      const cx = width / 2;
      const cy = height * 0.48;

      // 3D Cylinder geometry params
      const baseRadius = Math.min(width, height) * 0.38 * (scale / 1.5);
      const cardWidth = Math.min(width * 0.46, 260 * window.devicePixelRatio);
      const cardHeight = cardWidth * 1.22;

      // Calculate active center index for text overlay
      const normalizedAngle = ((progress % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const activeIdx =
        Math.round(((Math.PI * 2 - normalizedAngle) / (Math.PI * 2)) * numItems) % numItems;
      setActiveIndex((prev) => (prev !== activeIdx ? activeIdx : prev));

      // Calculate 3D item positions and sort by depth (Z)
      const renderList = [];

      for (let i = 0; i < numItems; i++) {
        const theta = (i / numItems) * Math.PI * 2 + progress;
        // 3D cylindrical coordinates
        const x = Math.sin(theta) * baseRadius;
        const z = Math.cos(theta) * baseRadius;
        const y = Math.sin(theta * 0.5) * (height * 0.04); // subtle vertical wave tilt

        // Perspective projection
        const fov = 650 * window.devicePixelRatio;
        const depth = z + baseRadius * 1.4;
        const perspective = fov / (fov + depth);

        const screenX = cx + x * perspective * 1.45;
        const screenY = cy + y * perspective;
        const scaleFactor = Math.max(0.4, perspective * 1.15);

        renderList.push({
          index: i,
          z,
          screenX,
          screenY,
          scaleFactor,
          perspective,
          alpha: Math.max(0.15, (z + baseRadius) / (baseRadius * 2)),
          item: items[i],
          image: stateRef.current.images[i],
        });
      }

      // Sort back-to-front
      renderList.sort((a, b) => a.z - b.z);

      // Draw each card
      renderList.forEach(({ screenX, screenY, scaleFactor, alpha, item, image, z }) => {
        const w = cardWidth * scaleFactor;
        const h = cardHeight * scaleFactor;
        const r = 18 * scaleFactor;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.globalAlpha = Math.min(1, Math.max(0.1, alpha * 1.15));

        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 24 * scaleFactor;
        ctx.shadowOffsetY = 12 * scaleFactor;

        // Card clipping path with rounded corners
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, r);
        ctx.clip();

        // Background / Image
        if (image && image.complete) {
          ctx.drawImage(image, -w / 2, -h / 2, w, h);
        } else {
          ctx.fillStyle = '#111827';
          ctx.fillRect(-w / 2, -h / 2, w, h);
        }

        // Overlay Gradient for contrast and glow
        const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        grad.addColorStop(0, 'rgba(15, 23, 42, 0.1)');
        grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.4)');
        grad.addColorStop(1, 'rgba(9, 11, 19, 0.92)');
        ctx.fillStyle = grad;
        ctx.fillRect(-w / 2, -h / 2, w, h);

        // Card Border with glow on front item
        ctx.restore();
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.globalAlpha = Math.min(1, Math.max(0.1, alpha));
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, r);

        const isFront = z > baseRadius * 0.55;
        if (isFront) {
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.9)';
          ctx.lineWidth = 2.5 * scaleFactor;
          ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
          ctx.shadowBlur = 16 * scaleFactor;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1 * scaleFactor;
        }
        ctx.stroke();

        ctx.restore();
      });

      stateRef.current.animId = requestAnimationFrame(render);
    };

    stateRef.current.animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(stateRef.current.animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [items, scale, autoSpeed, isHovered]);

  const activeItem = items[activeIndex] || items[0];

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full h-full min-h-[480px] lg:min-h-[580px] flex flex-col justify-between overflow-hidden select-none ${className}`}
    >
      {/* 3D WebGL / Canvas Menu Layer */}
      <div className="absolute inset-0 z-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Top Ambient Vignette & Branding Header */}
      <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-indigo-950/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wide">Infinite Security Modules</span>
        </div>
      </div>

      {/* Bottom Live Active Item Showcase Box */}
      <div className="relative z-10 p-6 sm:p-8">
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-indigo-500/30 backdrop-blur-xl shadow-2xl shadow-black/80 space-y-2 transition-all duration-300 transform">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-400">
              Module 0{((activeIndex + 1) % items.length) + 1} / 0{items.length}
            </span>
            {activeItem?.link && (
              <a
                href={activeItem.link}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-zinc-400 hover:text-indigo-300 flex items-center gap-1 transition-colors pointer-events-auto"
              >
                <span>Explore</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug line-clamp-1">
            {activeItem?.title || 'Security Node'}
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 font-normal">
            {activeItem?.description ||
              'Next-generation identity protocols with stateless cryptographic tokens.'}
          </p>
        </div>
      </div>
    </div>
  );
};
