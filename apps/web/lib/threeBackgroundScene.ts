"use client";

import { useEffect, type RefObject } from "react";
import type * as THREE from "three";

export type ThreeBackgroundPreset = "particles" | "waves" | "shapes" | "stars" | "network" | "rings";

export type ThreeSceneOptions = {
  preset: ThreeBackgroundPreset;
  color: string;
  /** Second accent color — mixed into stars/network/rings for depth; ignored by
   * presets that read only one color. */
  secondColor?: string;
  density: number;
  speed: number;
  /** Camera gently follows the pointer for a subtle depth/parallax feel. */
  mouseFollow?: boolean;
};

/** Three.js is ~150kb+ and most pages never use a 3D background — importing it inside
 * the effect (instead of a top-level `import * as THREE`) keeps it out of every page's
 * bundle and only fetches it when a component actually mounts one. Shared by the
 * dedicated "3D Background" section and Hero's background presets. */
async function mountScene(canvas: HTMLCanvasElement, container: HTMLElement, opts: ThreeSceneOptions) {
  const Three = await import("three");
  if (!canvas.isConnected) return null; // unmounted before the import resolved

  const { preset, color, density, speed } = opts;
  const secondColor = opts.secondColor || color;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new Three.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new Three.Scene();
  const camera = new Three.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = preset === "shapes" || preset === "rings" ? 9 : 6;

  const disposables: { dispose: () => void }[] = [];
  const animated: THREE.Object3D[] = [];

  // Per-preset frame updater, assigned while building the scene below.
  let update: (t: number) => void = () => {};

  if (preset === "particles") {
    const count = Math.max(10, Math.min(400, density));
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 12;
    const geometry = new Three.BufferGeometry();
    geometry.setAttribute("position", new Three.BufferAttribute(positions, 3));
    const material = new Three.PointsMaterial({ color, size: 0.06, transparent: true, opacity: 0.85 });
    const points = new Three.Points(geometry, material);
    scene.add(points);
    disposables.push(geometry, material);
    update = (t) => {
      points.rotation.y = t * 0.05 * speed;
      points.rotation.x = t * 0.02 * speed;
    };
  } else if (preset === "waves") {
    const geometry = new Three.PlaneGeometry(16, 10, 48, 30);
    const material = new Three.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.5 });
    const mesh = new Three.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 3.2;
    mesh.position.y = -1.5;
    scene.add(mesh);
    disposables.push(geometry, material);
    update = (t) => {
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, Math.sin(x * 0.5 + t * speed) * 0.4 + Math.cos(y * 0.5 + t * speed * 0.8) * 0.4);
      }
      pos.needsUpdate = true;
    };
  } else if (preset === "shapes") {
    const shapeCount = Math.max(3, Math.min(24, Math.round(density / 8)));
    for (let i = 0; i < shapeCount; i++) {
      const geometry =
        i % 2 === 0 ? new Three.IcosahedronGeometry(0.4 + Math.random() * 0.3, 0) : new Three.TorusGeometry(0.35, 0.12, 8, 24);
      const material = new Three.MeshBasicMaterial({
        color: i % 3 === 0 ? secondColor : color,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      });
      const mesh = new Three.Mesh(geometry, material);
      mesh.position.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 4);
      mesh.userData.spin = 0.002 + Math.random() * 0.004;
      mesh.userData.bobOffset = Math.random() * Math.PI * 2;
      scene.add(mesh);
      animated.push(mesh);
      disposables.push(geometry, material);
    }
    update = (t) => {
      for (const mesh of animated) {
        mesh.rotation.x += mesh.userData.spin;
        mesh.rotation.y += mesh.userData.spin * 1.3;
        mesh.position.y += Math.sin(t * speed + mesh.userData.bobOffset) * 0.002;
      }
    };
  } else if (preset === "stars") {
    // Two counter-rotating clouds at different sizes/colors read as depth layers.
    const makeCloud = (count: number, cloudColor: string, size: number) => {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 24;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      }
      const geometry = new Three.BufferGeometry();
      geometry.setAttribute("position", new Three.BufferAttribute(positions, 3));
      const material = new Three.PointsMaterial({ color: cloudColor, size, transparent: true, opacity: 0.9 });
      const points = new Three.Points(geometry, material);
      scene.add(points);
      disposables.push(geometry, material);
      return points;
    };
    const total = Math.max(40, Math.min(800, density * 2));
    const far = makeCloud(Math.round(total * 0.75), color, 0.045);
    const near = makeCloud(Math.round(total * 0.25), secondColor, 0.09);
    update = (t) => {
      far.rotation.y = t * 0.015 * speed;
      near.rotation.y = -t * 0.03 * speed;
      near.rotation.z = t * 0.008 * speed;
    };
  } else if (preset === "network") {
    // Drifting nodes with lines joining close pairs — the classic "constellation" look.
    const count = Math.max(20, Math.min(120, Math.round(density / 2)));
    const bounds = { x: 9, y: 5.5, z: 3 };
    const nodePos = new Float32Array(count * 3);
    const velocity = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      const axis = i % 3;
      nodePos[i] = (Math.random() - 0.5) * 2 * (axis === 0 ? bounds.x : axis === 1 ? bounds.y : bounds.z);
      velocity[i] = (Math.random() - 0.5) * 0.012;
    }
    const nodeGeometry = new Three.BufferGeometry();
    nodeGeometry.setAttribute("position", new Three.BufferAttribute(nodePos, 3));
    const nodeMaterial = new Three.PointsMaterial({ color, size: 0.09, transparent: true, opacity: 0.9 });
    scene.add(new Three.Points(nodeGeometry, nodeMaterial));

    const maxEdges = count * 8;
    const linePos = new Float32Array(maxEdges * 6);
    const lineGeometry = new Three.BufferGeometry();
    lineGeometry.setAttribute("position", new Three.BufferAttribute(linePos, 3));
    const lineMaterial = new Three.LineBasicMaterial({ color: secondColor, transparent: true, opacity: 0.22 });
    scene.add(new Three.LineSegments(lineGeometry, lineMaterial));
    disposables.push(nodeGeometry, nodeMaterial, lineGeometry, lineMaterial);

    const linkDistSq = 2.2 * 2.2;
    update = () => {
      for (let i = 0; i < count; i++) {
        for (let a = 0; a < 3; a++) {
          const idx = i * 3 + a;
          nodePos[idx] += velocity[idx] * speed;
          const limit = a === 0 ? bounds.x : a === 1 ? bounds.y : bounds.z;
          if (Math.abs(nodePos[idx]) > limit) velocity[idx] *= -1;
        }
      }
      let edge = 0;
      for (let i = 0; i < count && edge < maxEdges; i++) {
        for (let j = i + 1; j < count && edge < maxEdges; j++) {
          const dx = nodePos[i * 3] - nodePos[j * 3];
          const dy = nodePos[i * 3 + 1] - nodePos[j * 3 + 1];
          const dz = nodePos[i * 3 + 2] - nodePos[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < linkDistSq) {
            linePos.set([nodePos[i * 3], nodePos[i * 3 + 1], nodePos[i * 3 + 2]], edge * 6);
            linePos.set([nodePos[j * 3], nodePos[j * 3 + 1], nodePos[j * 3 + 2]], edge * 6 + 3);
            edge++;
          }
        }
      }
      lineGeometry.setDrawRange(0, edge * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      nodeGeometry.attributes.position.needsUpdate = true;
    };
  } else {
    // rings — nested wireframe orbits rotating on their own axes.
    const ringCount = 5;
    for (let i = 0; i < ringCount; i++) {
      const geometry = new Three.TorusGeometry(1.6 + i * 0.85, 0.02, 8, 96);
      const material = new Three.MeshBasicMaterial({
        color: i % 2 === 0 ? color : secondColor,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      });
      const mesh = new Three.Mesh(geometry, material);
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.userData.spinX = 0.001 + Math.random() * 0.003;
      mesh.userData.spinY = 0.001 + Math.random() * 0.003;
      scene.add(mesh);
      animated.push(mesh);
      disposables.push(geometry, material);
    }
    update = () => {
      for (const ring of animated) {
        ring.rotation.x += ring.userData.spinX * speed;
        ring.rotation.y += ring.userData.spinY * speed;
      }
    };
  }

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  // Pointer-follow: the camera eases toward a small offset opposite the pointer,
  // giving the whole scene a depth/parallax response without moving the content.
  let targetX = 0;
  let targetY = 0;
  let removePointer = () => {};
  if (opts.mouseFollow && !reducedMotion) {
    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.4;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * -0.9;
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    removePointer = () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }

  let raf = 0;
  const start = performance.now();

  function frame(now: number) {
    const t = (now - start) / 1000;
    if (!reducedMotion) update(t);
    if (opts.mouseFollow) {
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    removePointer();
    for (const d of disposables) d.dispose();
    renderer.dispose();
  };
}

/** Mounts an animated Three.js scene into `canvasRef` sized to `containerRef`, only
 * while `enabled` is true. Pass `enabled: false` to skip mounting entirely — no WebGL
 * context is created at all (the component's inactive/off state). */
export function useThreeBackgroundScene(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  options: ThreeSceneOptions
) {
  const { preset, color, secondColor, density, speed, mouseFollow } = options;

  useEffect(() => {
    if (!enabled) return;
    let cleanup: (() => void) | null = null;
    let cancelled = false;
    if (containerRef.current && canvasRef.current) {
      mountScene(canvasRef.current, containerRef.current, {
        preset,
        color,
        secondColor,
        density,
        speed,
        mouseFollow,
      }).then((fn) => {
        if (cancelled) fn?.();
        else cleanup = fn;
      });
    }
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [canvasRef, containerRef, enabled, preset, color, secondColor, density, speed, mouseFollow]);
}
