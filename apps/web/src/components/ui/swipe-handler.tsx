'use client';

import { useCallback, useRef } from 'react';

interface SwipeHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

/**
 * Lightweight swipe gesture handler for mobile navigation.
 * Detects horizontal/vertical swipes and fires callbacks.
 * 
 * Usage:
 *   <SwipeHandler onSwipeRight={() => setSidebarOpen(true)} onSwipeLeft={() => setSidebarOpen(false)}>
 *     {children}
 *   </SwipeHandler>
 */
export function SwipeHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
}: SwipeHandlerProps): React.JSX.Element {
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const elapsed = Date.now() - startTime.current;

    // Ignore slow drags (> 500ms) — only fast swipes
    if (elapsed > 500) return;

    const diffX = endX - startX.current;
    const diffY = endY - startY.current;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // Must exceed threshold and be primarily in one direction
    if (absDiffX < threshold && absDiffY < threshold) return;

    if (absDiffX > absDiffY) {
      // Horizontal swipe
      if (diffX > 0 && onSwipeRight) {
        // Only trigger from left edge (first 40px) for sidebar open
        if (startX.current < 40) {
          onSwipeRight();
        }
      } else if (diffX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (diffY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (diffY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}
