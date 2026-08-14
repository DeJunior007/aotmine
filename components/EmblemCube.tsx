"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const FACE = 230;
const HALF = FACE / 2;

export function EmblemCube() {
  const wrapRef = useRef<HTMLDivElement>(null);

  // parallax sutil de mouse por cima do float/spin continuos
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 120, damping: 16 });
  const springY = useSpring(my, { stiffness: 120, damping: 16 });
  const tiltX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const tiltY = useTransform(springX, [-0.5, 0.5], [-14, -34]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex min-h-[400px] items-center justify-center"
    >
      {/* aneis girando */}
      <motion.div
        className="absolute aspect-square w-[min(420px,92%)] rounded-full border border-dashed border-accent/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute aspect-square w-[min(320px,74%)] rounded-full border border-accent/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
      />
      <div
        className="absolute aspect-square w-[min(500px,100%)] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(95,190,108,.18), transparent 62%)",
        }}
      />

      {/* cubo */}
      <motion.div
        className="relative"
        style={{ width: FACE, height: FACE, perspective: 900 }}
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            rotateX: tiltX,
            rotateY: tiltY,
          }}
        >
          {/* face frontal — emblema */}
          <div
            className="absolute flex items-center justify-center border border-accent/55 shadow-[inset_0_0_60px_rgba(95,190,108,0.22)]"
            style={{
              width: FACE,
              height: FACE,
              transform: `translateZ(${HALF}px)`,
              background:
                "linear-gradient(150deg, rgba(32,61,38,.96), rgba(11,14,12,.96)), repeating-linear-gradient(90deg, rgba(127,214,138,.13) 0 1px, transparent 1px 28.75px), repeating-linear-gradient(180deg, rgba(127,214,138,.13) 0 1px, transparent 1px 28.75px)",
            }}
          >
            <Image
              src="/emblem.png"
              alt="Emblema do servidor"
              width={132}
              height={179}
              className="opacity-95 drop-shadow-[0_0_18px_rgba(127,214,138,0.55)]"
              style={{
                filter:
                  "grayscale(1) sepia(1) hue-rotate(64deg) saturate(2.6) brightness(1.05) contrast(1.12)",
              }}
              priority
            />
          </div>
          {/* face direita */}
          <div
            className="absolute border border-accent/34"
            style={{
              width: FACE,
              height: FACE,
              transform: `rotateY(90deg) translateZ(${HALF}px)`,
              background:
                "linear-gradient(150deg, rgba(23,53,31,.95), rgba(11,14,12,.98)), repeating-linear-gradient(180deg, rgba(127,214,138,.1) 0 1px, transparent 1px 28.75px)",
            }}
          />
          {/* face de cima */}
          <div
            className="absolute border border-accent/42"
            style={{
              width: FACE,
              height: FACE,
              transform: `rotateX(90deg) translateZ(${HALF}px)`,
              background:
                "linear-gradient(150deg, rgba(62,143,77,.5), rgba(16,20,16,.95)), repeating-linear-gradient(90deg, rgba(127,214,138,.12) 0 1px, transparent 1px 28.75px)",
            }}
          />
          {/* face esquerda */}
          <div
            className="absolute border border-accent/20 bg-bg/96"
            style={{ width: FACE, height: FACE, transform: `rotateY(-90deg) translateZ(${HALF}px)` }}
          />
          {/* face de baixo */}
          <div
            className="absolute border border-accent/20 bg-bg/96"
            style={{ width: FACE, height: FACE, transform: `rotateX(-90deg) translateZ(${HALF}px)` }}
          />
        </motion.div>
      </motion.div>

      <span className="absolute top-[6%] left-[2%] font-mono-ui text-[9px] leading-[1.7] tracking-[0.16em] text-accent/50">
        NODE_ID: PARADIS-01
        <br />
        BUILD: FORGE 1.20.1
      </span>
      <span className="absolute right-[2%] bottom-[8%] text-right font-mono-ui text-[9px] leading-[1.7] tracking-[0.16em] text-accent/50">
        COMBAT STATUS: READY
        <br />
        CONNECTION: STABLE
      </span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono-ui text-[10px] font-semibold tracking-[0.28em] text-text/45">
        PARADIS CORE
      </span>
    </div>
  );
}
