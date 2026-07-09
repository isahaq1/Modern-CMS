"use client";

import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { NodeStyle } from "@pgcms/shared";

let pluginRegistered = false;

// One-shot reveal tweens — element starts at these values and animates to its natural
// (pre-tween) state. Used for onLoad/onScroll.
const FROM_VARS: Record<string, gsap.TweenVars> = {
  fadeIn: { opacity: 0 },
  slideUp: { opacity: 0, y: 40 },
  slideDown: { opacity: 0, y: -40 },
  slideLeft: { opacity: 0, x: 40 },
  slideRight: { opacity: 0, x: -40 },
  zoomIn: { opacity: 0, scale: 0.92 },
  scrollReveal: { opacity: 0, y: 24 },
  rotateIn: { opacity: 0, rotation: -12 },
  pulse: { opacity: 0, scale: 0.9 },
  blurIn: { opacity: 0, filter: "blur(14px)" },
  flipIn: { opacity: 0, rotationX: -65, transformOrigin: "50% 0%" },
  bounceIn: { opacity: 0, scale: 0.5, y: -40 },
};

// Effects whose motion only reads right with a specific ease — used as the default
// when the user hasn't picked one explicitly.
const EFFECT_DEFAULT_EASE: Record<string, string> = {
  bounceIn: "bounce.out",
  flipIn: "back.out(1.4)",
};

// Toggle tweens — element starts at its natural state and animates *to* these values;
// used for onHover/onFocus (which reverse back out) and onClick (which restarts).
const INTERACTIVE_VARS: Record<string, gsap.TweenVars> = {
  fadeIn: { opacity: 0.55 },
  slideUp: { y: -6 },
  slideDown: { y: 6 },
  slideLeft: { x: -6 },
  slideRight: { x: 6 },
  zoomIn: { scale: 1.05 },
  scrollReveal: { y: -4 },
  rotateIn: { rotation: -4 },
  pulse: { scale: 1.08 },
  blurIn: { opacity: 0.7, filter: "blur(2px)" },
  flipIn: { rotationX: 8, transformOrigin: "50% 0%" },
  bounceIn: { scale: 1.06 },
};

const INTERACTIVE_TRIGGERS = new Set(["onHover", "onFocus", "onClick"]);

/** Universal animation for any rendered node — driven entirely by NodeStyle fields set
 * from the Inspector, so no per-component-type wiring is needed. Applied only on the
 * public renderer (see Renderer.tsx); the builder canvas renders nodes in their settled
 * final state so editing stays stable. */
export function useEntranceAnimation(ref: RefObject<HTMLElement | null>, style: NodeStyle) {
  const {
    animationType,
    animationTrigger,
    animationDuration,
    animationDelay,
    animationEasing,
    animationLoop,
    animationStagger,
  } = style;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !animationType || animationType === "none") return;

    if (!pluginRegistered) {
      gsap.registerPlugin(ScrollTrigger);
      pluginRegistered = true;
    }

    const trigger = animationTrigger ?? (animationType === "scrollReveal" ? "onScroll" : "onLoad");
    const duration = animationDuration ?? 0.8;
    const delay = animationDelay ?? 0;
    const ease = animationEasing || EFFECT_DEFAULT_EASE[animationType] || "power2.out";

    if (INTERACTIVE_TRIGGERS.has(trigger)) {
      // A paused toggle tween never renders anything until played, so — unlike the
      // one-shot "from" tweens below — React Strict Mode's dev-only double-invoke of
      // this effect can't leave it in a half-animated state; plain kill() is enough.
      const toVars = INTERACTIVE_VARS[animationType] ?? INTERACTIVE_VARS.fadeIn;
      // onClick is a self-contained "tap" gesture — play forward then automatically back
      // out, rather than needing a second click to undo it like hover/focus's reverse().
      const tween = gsap.to(el, {
        ...toVars,
        duration,
        ease,
        paused: true,
        ...(trigger === "onClick" ? { repeat: 1, yoyo: true } : {}),
      });

      let removeListeners = () => {};
      if (trigger === "onHover") {
        const enter = () => tween.play();
        const leave = () => tween.reverse();
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
        removeListeners = () => {
          el.removeEventListener("mouseenter", enter);
          el.removeEventListener("mouseleave", leave);
        };
      } else if (trigger === "onFocus") {
        // focusin/focusout bubble from whichever focusable descendant (button, link,
        // input) actually receives focus — the section itself doesn't need a tabindex.
        const focusIn = () => tween.play();
        const focusOut = () => tween.reverse();
        el.addEventListener("focusin", focusIn);
        el.addEventListener("focusout", focusOut);
        removeListeners = () => {
          el.removeEventListener("focusin", focusIn);
          el.removeEventListener("focusout", focusOut);
        };
      } else {
        const onClick = () => tween.restart();
        el.addEventListener("click", onClick);
        removeListeners = () => el.removeEventListener("click", onClick);
      }

      return () => {
        removeListeners();
        tween.kill();
      };
    }

    // React 18 Strict Mode double-invokes effects on mount (create, cleanup, create
    // again) purely as a dev-mode sanity check. `tween.kill()` alone doesn't undo the
    // inline styles gsap.from() already applied, so the second invocation's "from" call
    // would capture the barely-animated first tween's paused values as its target and
    // visibly never move. `gsap.context().revert()` undoes those inline styles too, so
    // the second invocation starts from the element's true original state.
    const ctx = gsap.context(() => {
      const fromVars = FROM_VARS[animationType] ?? FROM_VARS.fadeIn;
      // With a stagger, reveal the section's inner items one after another instead of
      // the whole block at once. The DOM depth of "the items" varies per component
      // (cards in a grid, paragraphs in prose, buttons in a row), so find the densest
      // shallow group: the element with the most direct children near the top.
      const targets = animationStagger ? findStaggerTargets(el) : el;
      gsap.from(targets, {
        ...fromVars,
        duration,
        delay,
        ease,
        stagger: animationStagger || 0,
        repeat: animationLoop ? -1 : 0,
        yoyo: animationLoop || undefined,
        scrollTrigger: trigger === "onScroll" ? { trigger: el, start: "top 85%", once: true } : undefined,
      });
    });

    return () => ctx.revert();
  }, [
    ref,
    animationType,
    animationTrigger,
    animationDuration,
    animationDelay,
    animationEasing,
    animationLoop,
    animationStagger,
  ]);
}

/** The stagger targets for a section: walk a few levels down and pick the element
 * holding the most direct children — for a CardGrid that's the grid (cards), for
 * prose it's the paragraph list, for a CTA it's the flex column (heading/sub/button).
 * Falls back to the section itself when nothing groups. */
function findStaggerTargets(el: HTMLElement): HTMLElement | Element[] {
  let best: Element | null = null;
  let bestCount = 1;
  const queue: { node: Element; depth: number }[] = [{ node: el, depth: 0 }];
  while (queue.length) {
    const { node, depth } = queue.shift()!;
    if (node.children.length > bestCount) {
      best = node;
      bestCount = node.children.length;
    }
    if (depth < 4) {
      for (const child of Array.from(node.children)) queue.push({ node: child, depth: depth + 1 });
    }
  }
  return best ? Array.from(best.children) : el;
}

/** Always-on pointer/scroll effects, independent of the entrance animation:
 * `parallaxSpeed` scrubs the section vertically against the scroll, and
 * `hoverEffect: "tilt"` makes it follow the pointer in 3D. (The other hover effects —
 * lift/glow/scale — are pure CSS classes applied by Renderer; only tilt needs JS.) */
export function useModernEffects(ref: RefObject<HTMLElement | null>, style: NodeStyle) {
  const { parallaxSpeed, hoverEffect } = style;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!parallaxSpeed && hoverEffect !== "tilt") return;

    if (!pluginRegistered) {
      gsap.registerPlugin(ScrollTrigger);
      pluginRegistered = true;
    }

    const ctx = gsap.context(() => {
      if (parallaxSpeed) {
        gsap.to(el, {
          y: parallaxSpeed * 120,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
    });

    let removeTilt = () => {};
    if (hoverEffect === "tilt") {
      const rotX = gsap.quickTo(el, "rotationX", { duration: 0.4, ease: "power2.out" });
      const rotY = gsap.quickTo(el, "rotationY", { duration: 0.4, ease: "power2.out" });
      gsap.set(el, { transformPerspective: 900 });
      const onMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rotY(px * 10);
        rotX(py * -10);
      };
      const onLeave = () => {
        rotX(0);
        rotY(0);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      removeTilt = () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    }

    return () => {
      removeTilt();
      ctx.revert();
    };
  }, [ref, parallaxSpeed, hoverEffect]);
}
