import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

export function AnimatedCounter({ value, duration = 400 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;
    if (startValue === endValue) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing: easeOutQuad
      const easedProgress = progress * (2 - progress);
      const currentValue = Math.round(startValue + easedProgress * (endValue - startValue));
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return (
    <motion.span
      id={`counter-${value}`}
      key={value}
      initial={{ scale: 0.8, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 15 }}
      className="inline-block"
    >
      {displayValue}
    </motion.span>
  );
}

export default AnimatedCounter;
