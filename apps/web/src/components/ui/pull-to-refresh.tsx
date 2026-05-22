'use client';

import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = '',
}: PullToRefreshProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || isRefreshing) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isDragging.current = false;
      setPullDistance(0);
      return;
    }
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      // Resistance factor — pull feels natural
      setPullDistance(Math.min(diff * 0.4, threshold * 1.5));
    }
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default: invalidate all queries
          await queryClient.invalidateQueries();
        }
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh, queryClient]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: isRefreshing ? 48 : pullDistance > 10 ? pullDistance : 0 }}
      >
        <div className="flex items-center gap-2 text-sm text-[color:var(--profile-muted,#6b7280)]">
          {isRefreshing ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs font-medium">Memperbarui...</span>
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5 transition-transform duration-200"
                style={{ transform: `rotate(${progress >= 1 ? 180 : 0}deg)` }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
              <span className="text-xs font-medium">
                {progress >= 1 ? 'Lepas untuk refresh' : 'Tarik ke bawah'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${isRefreshing ? 48 : pullDistance > 10 ? pullDistance : 0}px)`,
          transitionDuration: isDragging.current ? '0ms' : '200ms',
        }}
      >
        {children}
      </div>
    </div>
  );
}
