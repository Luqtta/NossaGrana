import { useEffect, useState } from 'react';
import { formatBRL } from '../utils/formatBRL';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
}

export const AnimatedNumber = ({ value, duration = 1000, prefix = 'R$ ' }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setDisplayValue(value * progress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{prefix}{formatBRL(displayValue)}</>;
};