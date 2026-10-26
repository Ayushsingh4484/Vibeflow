import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlassStore } from '../../store/useGlassStore';

interface LiquidNavContainerProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal';
  indicatorClassName?: string;
  activeSelector?: string; // CSS selector to identify the active item, defaults to '[aria-current="page"], .active, [data-active="true"]'
  pillBorderRadius?: string; // CSS border-radius, defaults to 'rounded-2xl'
}

interface RectState {
  top: number;
  left: number;
  width: number;
  height: number;
  visible: boolean;
}

export const LiquidNavContainer: React.FC<LiquidNavContainerProps> = ({
  children,
  className = 'relative',
  direction = 'vertical',
  indicatorClassName = '',
  activeSelector = '[aria-current="page"], .active, [data-active="true"]',
  pillBorderRadius = 'rounded-2xl',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const reduceAnimations = useGlassStore((state) => state.settings.reduceAnimations);

  const prevRectRef = useRef<RectState | null>(null);
  const isInitialMount = useRef(true);
  const currentAnimationRef = useRef<Animation | null>(null);

  const [rect, setRect] = useState<RectState>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    visible: false,
  });

  const updatePosition = (animate = true) => {
    if (!containerRef.current || !indicatorRef.current) return;

    // Search for active element matching activeSelector or aria-current
    const activeEl = containerRef.current.querySelector<HTMLElement>(activeSelector);

    if (!activeEl) {
      setRect((prev) => ({ ...prev, visible: false }));
      prevRectRef.current = null;
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    const targetTop = activeRect.top - containerRect.top;
    const targetLeft = activeRect.left - containerRect.left;
    const targetWidth = activeRect.width;
    const targetHeight = activeRect.height;

    const newRect: RectState = {
      top: targetTop,
      left: targetLeft,
      width: targetWidth,
      height: targetHeight,
      visible: true,
    };

    // If this is initial render or animation is disabled, snap immediately
    if (isInitialMount.current || !animate || reduceAnimations) {
      isInitialMount.current = false;
      prevRectRef.current = newRect;
      setRect(newRect);
      return;
    }

    const prevRect = prevRectRef.current;
    prevRectRef.current = newRect;

    // If previously not visible or same position, don't stretch
    if (!prevRect || !prevRect.visible || (prevRect.top === targetTop && prevRect.left === targetLeft)) {
      setRect(newRect);
      return;
    }

    // Measure delta from previous position to target position
    const deltaX = targetLeft - prevRect.left;
    const deltaY = targetTop - prevRect.top;

    // Check if motion occurred
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < 2) {
      setRect(newRect);
      return;
    }

    // Cancel existing animation if user clicked rapidly
    if (currentAnimationRef.current) {
      currentAnimationRef.current.cancel();
    }

    // Update state to target dimensions and coordinates
    setRect(newRect);

    const isVertical = direction === 'vertical' || Math.abs(deltaY) > Math.abs(deltaX);

    // Liquid droplet spring keyframes:
    // 0%: at previous position, normal scale
    // 35%: in-flight stretch along vector of motion (water surface tension elongation)
    // 72%: arrival compression (droplet impact squash with subtle fluid overshoot)
    // 100%: perfectly settled at target shape
    let keyframes: Keyframe[] = [];

    if (isVertical) {
      const stretchY = Math.min(1.24, 1 + Math.abs(deltaY) / 450);
      const squashX = Math.max(0.86, 1 - Math.abs(deltaY) / 650);
      const overshootY = deltaY * 0.05;

      keyframes = [
        {
          transform: `translate3d(0, ${-deltaY}px, 0) scale(1, 1)`,
          transformOrigin: deltaY > 0 ? 'top center' : 'bottom center',
          offset: 0,
        },
        {
          transform: `translate3d(0, ${-deltaY * 0.42}px, 0) scale(${squashX}, ${stretchY})`,
          transformOrigin: deltaY > 0 ? 'top center' : 'bottom center',
          offset: 0.35,
        },
        {
          transform: `translate3d(0, ${overshootY}px, 0) scale(${1 + (1 - squashX) * 0.5}, ${1 - (stretchY - 1) * 0.5})`,
          transformOrigin: 'center center',
          offset: 0.72,
        },
        {
          transform: 'translate3d(0, 0, 0) scale(1, 1)',
          transformOrigin: 'center center',
          offset: 1,
        },
      ];
    } else {
      const stretchX = Math.min(1.26, 1 + Math.abs(deltaX) / 380);
      const squashY = Math.max(0.85, 1 - Math.abs(deltaX) / 600);
      const overshootX = deltaX * 0.05;

      keyframes = [
        {
          transform: `translate3d(${-deltaX}px, 0, 0) scale(1, 1)`,
          transformOrigin: deltaX > 0 ? 'left center' : 'right center',
          offset: 0,
        },
        {
          transform: `translate3d(${-deltaX * 0.42}px, 0, 0) scale(${stretchX}, ${squashY})`,
          transformOrigin: deltaX > 0 ? 'left center' : 'right center',
          offset: 0.35,
        },
        {
          transform: `translate3d(${overshootX}px, 0, 0) scale(${1 - (stretchX - 1) * 0.5}, ${1 + (1 - squashY) * 0.5})`,
          transformOrigin: 'center center',
          offset: 0.72,
        },
        {
          transform: 'translate3d(0, 0, 0) scale(1, 1)',
          transformOrigin: 'center center',
          offset: 1,
        },
      ];
    }

    try {
      const anim = indicatorRef.current.animate(keyframes, {
        duration: 380,
        easing: 'cubic-bezier(0.25, 1, 0.33, 1)', // Fluid, responsive spring curve
        fill: 'both',
      });

      currentAnimationRef.current = anim;
      anim.onfinish = () => {
        if (indicatorRef.current) {
          indicatorRef.current.style.transform = 'translate3d(0, 0, 0) scale(1, 1)';
        }
        currentAnimationRef.current = null;
      };
    } catch {
      // Fallback for environments lacking full WAAPI support
      if (indicatorRef.current) {
        indicatorRef.current.style.transform = 'translate3d(0, 0, 0) scale(1, 1)';
      }
    }
  };

  // Re-run position calculation on route change or when DOM updates
  useLayoutEffect(() => {
    // Small timeout ensures router active states have finished updating in DOM
    const timer = requestAnimationFrame(() => {
      updatePosition(true);
    });
    return () => cancelAnimationFrame(timer);
  }, [location.pathname, activeSelector, reduceAnimations]);

  // Window resize observer to adapt to layout shifts without triggering liquid stretch
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      updatePosition(false);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* The Single Moving Liquid Water-Drop Highlight Element */}
      <div
        ref={indicatorRef}
        aria-hidden="true"
        className={`pointer-events-none absolute z-0 transition-opacity duration-200 ${pillBorderRadius} bg-gradient-to-r from-red-500 via-rose-500 to-red-600 shadow-lg shadow-red-500/35 border-t border-white/40 overflow-hidden ${indicatorClassName}`}
        style={{
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          opacity: rect.visible ? 1 : 0,
          willChange: 'transform, top, left, width, height',
        }}
      >
        {/* Top edge light refraction line (Water droplet surface highlight) */}
        <div className="absolute inset-x-2 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full" />
        {/* Soft radial ambient glare */}
        <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-transparent opacity-60 pointer-events-none" />
      </div>

      {/* Navigation Children */}
      {children}
    </div>
  );
};
