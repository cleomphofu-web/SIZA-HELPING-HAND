"use client";

import { useEffect } from "react";

export default function useStripFramerStyles(selector: string, properties: string[]) {
  useEffect(() => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) return;
    const strip = () => properties.forEach((property) => {
      element.style.setProperty(property, /filter|mask|overflow|will/i.test(property) ? "none" : "");
    });
    strip();
    const observer = new MutationObserver(strip);
    observer.observe(element, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [selector, properties]);
}
