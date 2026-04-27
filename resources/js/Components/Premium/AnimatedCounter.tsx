import React from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export default function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));

  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.p className={className}>{display}</motion.p>;
}
