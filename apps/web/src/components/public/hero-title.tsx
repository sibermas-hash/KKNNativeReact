'use client';

import { useState, useEffect } from 'react';

export function HeroTitle({ title }: { title: string }) {
  const [typedTitle, setTypedTitle] = useState('');
  const [typingPhase, setTypingPhase] = useState<'typing' | 'holding' | 'deleting'>('typing');

  useEffect(() => {
    const isComplete = typedTitle.length >= title.length;
    const isEmpty = typedTitle.length === 0;

    let timeoutDelay = 0;

    if (typingPhase === 'typing') {
      if (isComplete) {
        setTypingPhase('holding');
        return;
      }
      timeoutDelay = 165;
    } else if (typingPhase === 'holding') {
      timeoutDelay = 2200;
    } else {
      if (isEmpty) {
        setTypingPhase('typing');
        return;
      }
      timeoutDelay = 90;
    }

    const timeoutId = window.setTimeout(() => {
      if (typingPhase === 'typing') {
        setTypedTitle(title.slice(0, typedTitle.length + 1));
        return;
      }
      if (typingPhase === 'holding') {
        setTypingPhase('deleting');
        return;
      }
      setTypedTitle(title.slice(0, typedTitle.length - 1));
    }, timeoutDelay);

    return () => window.clearTimeout(timeoutId);
  }, [title, typedTitle, typingPhase]);

  return (
    <h1 className="mx-auto max-w-[18ch] font-display text-[1.28rem] font-semibold uppercase tracking-[0.04em] text-white sm:text-[1.72rem] lg:text-[1.95rem]">
      {typedTitle}
      <span className="typing-cursor ml-1 inline-block text-white/90">|</span>
    </h1>
  );
}
