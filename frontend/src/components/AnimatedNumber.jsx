import React, { useEffect, useRef } from 'react';
import { useInView, animate } from 'framer-motion';

const AnimatedNumber = ({ value, prefix = "", decimals = 2, duration = 1.5 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (inView) {
      const node = ref.current;
      const controls = animate(0, value, {
        duration: duration,
        ease: "easeOut",
        onUpdate(v) {
          node.textContent = prefix + v.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        },
      });
      return () => controls.stop();
    }
  }, [value, inView, prefix, duration, decimals]);

  return <span ref={ref}>0</span>;
};

export default AnimatedNumber;

