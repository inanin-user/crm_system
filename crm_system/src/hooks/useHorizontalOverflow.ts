// hooks/useHorizontalOverflow.ts

import { useEffect, useRef, useState } from "react";

export function useHorizontalOverflow<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const checkOverflow = () => {
      setIsOverflowing(
        container.scrollWidth > container.clientWidth,
      );
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(container);

    // Useful when the content itself changes size.
    const mutationObserver = new MutationObserver(checkOverflow);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    window.addEventListener("resize", checkOverflow);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  return {
    containerRef,
    isOverflowing,
  };
}