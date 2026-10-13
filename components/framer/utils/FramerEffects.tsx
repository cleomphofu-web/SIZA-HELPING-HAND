"use client";

import { useEffect } from "react";

const reveals = [
  ".framer-1397sen-container", ".framer-1uxlhvc-container", ".framer-17vhpkl-container",
  ".framer-1nxhf8p-container", ".framer-qps9b1-container", ".framer-xzf1ho-container",
];

export default function FramerEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observers: IntersectionObserver[] = [];
    reveals.forEach((selector) => {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        const observer = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) return;
          element.animate([{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }], {
            duration: 500, easing: "cubic-bezier(0, 0, 1, 1)", fill: "forwards",
          });
          observer.disconnect();
        }, { threshold: 0.5 });
        observer.observe(element);
        observers.push(observer);
      });
    });
    const loops = [...document.querySelectorAll<HTMLElement>(".framer-3kqwgf")].map((element) => ({
      element,
      animation: element.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: 1000, easing: "cubic-bezier(0, 0, 1, 1)", iterations: Infinity }),
    }));
    const loopObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      const loop = loops.find(({ element }) => element === entry.target);
      if (loop) entry.isIntersecting ? loop.animation.play() : loop.animation.pause();
    }));
    loops.forEach(({ element }) => loopObserver.observe(element));
    return () => { observers.forEach((observer) => observer.disconnect()); loopObserver.disconnect(); loops.forEach(({ animation }) => animation.cancel()); };
  }, []);
  return null;
}
