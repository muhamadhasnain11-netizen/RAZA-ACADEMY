"use client";
import { useEffect } from "react";

// Slides content in from the side as it scrolls into view.
const LEFT = ".hero-l > *, .sec > .wrap > h2, .sec > .wrap > .lead, .cta .wrap > *, .portalbar";
const ALT = ".plan, .pass, .card, .stat, .rev, .badge, .lb-row, .poster li, .tabs";
const RIGHT = ".poster";

export function ScrollFX() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    const tag = (el, dir, i) => {
      if (el.dataset.reveal) return;
      el.dataset.reveal = dir;
      el.style.setProperty("--d", (i % 5) * 70 + "ms");
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) el.classList.add("in"); else io.observe(el);
    };
    const scan = () => {
      document.querySelectorAll(LEFT).forEach((el, i) => tag(el, "l", i));
      document.querySelectorAll(RIGHT).forEach((el, i) => tag(el, "r", i));
      document.querySelectorAll(ALT).forEach((el) => tag(el, [...el.parentElement.children].indexOf(el) % 2 ? "r" : "l", [...el.parentElement.children].indexOf(el)));
    };
    scan();
    let raf = 0;
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(scan); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); io.disconnect(); };
  }, []);
  return null;
}
