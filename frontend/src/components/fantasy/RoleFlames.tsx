"use client";

import { useEffect, useRef } from "react";

type RoleFlamesProps = {
  role: string;
  captain?: boolean;
};

type FlameParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  sway: number;
  phase: number;
  alpha: number;
};

type FlameTheme = {
  core: string;
  hot: string;
  main: string;
  outer: string;
};

function getTheme(role: string, captain: boolean): FlameTheme {
  if (captain) {
    return {
      core: "#fffde2",
      hot: "#ffd43b",
      main: "#ff7200",
      outer: "#ff2400",
    };
  }

  const normalized = role.toLowerCase();

  if (
    normalized.includes("rusher") ||
    normalized.includes("entry") ||
    normalized.includes("fragger")
  ) {
    return {
      core: "#fff4bd",
      hot: "#ffc400",
      main: "#ff6200",
      outer: "#ff1800",
    };
  }

  if (
    normalized.includes("sniper") ||
    normalized.includes("igl")
  ) {
    return {
      core: "#ffffff",
      hot: "#ffd84a",
      main: "#ff8c00",
      outer: "#ff3b00",
    };
  }

  if (
    normalized.includes("support") ||
    normalized.includes("utility")
  ) {
    return {
      core: "#fff9df",
      hot: "#ffc857",
      main: "#ff7b22",
      outer: "#ff3d00",
    };
  }

  return {
    core: "#fff4c7",
    hot: "#ffc21c",
    main: "#ff6a00",
    outer: "#ff2200",
  };
}

export default function RoleFlames({
  role,
  captain = false,
}: RoleFlamesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;

    if (!canvasElement) {
      return;
    }

    const context = canvasElement.getContext("2d");

    if (!context) {
      return;
    }

    // From this point onward these are guaranteed non-null.
    const canvas: HTMLCanvasElement = canvasElement;
    const ctx: CanvasRenderingContext2D = context;

    const theme = getTheme(role, captain);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let running = true;

    const particles: FlameParticle[] = [];

    function hexToRgba(
      hex: string,
      alpha: number,
    ): string {
      const clean = hex.replace("#", "");

      const r = parseInt(
        clean.slice(0, 2),
        16,
      );

      const g = parseInt(
        clean.slice(2, 4),
        16,
      );

      const b = parseInt(
        clean.slice(4, 6),
        16,
      );

      return `rgba(${r}, ${g}, ${b}, ${Math.max(
        0,
        Math.min(1, alpha),
      )})`;
    }

    function resize() {
      const rect =
        canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      dpr = Math.min(
        window.devicePixelRatio || 1,
        2,
      );

      canvas.width = Math.max(
        1,
        Math.floor(width * dpr),
      );

      canvas.height = Math.max(
        1,
        Math.floor(height * dpr),
      );

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0,
      );
    }

    function createParticle(
      initial = false,
    ): FlameParticle {
      const maxLife =
        420 + Math.random() * 850;

      return {
        x:
          width *
          (0.05 + Math.random() * 0.9),

        y: initial
          ? height *
            (0.35 + Math.random() * 0.65)
          : height *
            (0.84 + Math.random() * 0.18),

        vx:
          (Math.random() - 0.5) *
          0.45,

        vy:
          -(0.45 + Math.random() * 1.45) *
          (captain ? 1.12 : 1),

        life: initial
          ? Math.random() * maxLife
          : 0,

        maxLife,

        size:
          (1.8 + Math.random() * 5.5) *
          (captain ? 1.15 : 1),

        sway:
          0.4 + Math.random() * 1.3,

        phase:
          Math.random() *
          Math.PI *
          2,

        alpha:
          0.35 + Math.random() * 0.65,
      };
    }

    function resetParticle(
      particle: FlameParticle,
    ) {
      Object.assign(
        particle,
        createParticle(false),
      );
    }

    function seedParticles() {
      particles.length = 0;

      const count = captain ? 85 : 65;

      for (let i = 0; i < count; i++) {
        particles.push(
          createParticle(true),
        );
      }
    }

    function drawBaseGlow() {
      const gradient =
        ctx.createRadialGradient(
          width / 2,
          height,
          0,
          width / 2,
          height,
          width * 0.75,
        );

      gradient.addColorStop(
        0,
        hexToRgba(theme.outer, 0.48),
      );

      gradient.addColorStop(
        0.28,
        hexToRgba(theme.main, 0.28),
      );

      gradient.addColorStop(
        0.58,
        hexToRgba(theme.hot, 0.1),
      );

      gradient.addColorStop(
        1,
        hexToRgba(theme.outer, 0),
      );

      ctx.fillStyle = gradient;

      ctx.fillRect(
        0,
        height * 0.38,
        width,
        height * 0.62,
      );
    }

    function drawFlameTongues(
      time: number,
    ) {
      const count = captain ? 11 : 9;

      for (let i = 0; i < count; i++) {
        const normalized =
          i / (count - 1);

        const x =
          width *
          (0.05 +
            normalized * 0.9);

        const wave =
          Math.sin(
            time * 0.004 +
              i * 1.73,
          ) *
          width *
          0.045;

        const secondaryWave =
          Math.sin(
            time * 0.007 +
              i * 2.37,
          ) *
          width *
          0.018;

        const flameHeight =
          height *
          (0.22 +
            Math.sin(
              time * 0.003 +
                i * 1.91,
            ) *
              0.055 +
            Math.random() *
              0.025);

        const tipX =
          x +
          wave +
          secondaryWave;

        const tipY =
          height -
          flameHeight;

        const gradient =
          ctx.createLinearGradient(
            x,
            height,
            tipX,
            tipY,
          );

        gradient.addColorStop(
          0,
          hexToRgba(theme.outer, 0.8),
        );

        gradient.addColorStop(
          0.28,
          hexToRgba(theme.main, 0.62),
        );

        gradient.addColorStop(
          0.58,
          hexToRgba(theme.hot, 0.34),
        );

        gradient.addColorStop(
          0.82,
          hexToRgba(theme.core, 0.13),
        );

        gradient.addColorStop(
          1,
          hexToRgba(theme.core, 0),
        );

        ctx.beginPath();

        ctx.moveTo(
          x - width * 0.075,
          height + 4,
        );

        ctx.bezierCurveTo(
          x - width * 0.055,
          height -
            flameHeight * 0.18,
          x +
            wave -
            width * 0.075,
          height -
            flameHeight * 0.55,
          tipX,
          tipY,
        );

        ctx.bezierCurveTo(
          tipX +
            width * 0.035,
          height -
            flameHeight * 0.68,
          x +
            wave +
            width * 0.075,
          height -
            flameHeight * 0.3,
          x + width * 0.08,
          height + 4,
        );

        ctx.closePath();

        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    function drawParticle(
      particle: FlameParticle,
      time: number,
    ) {
      const progress =
        particle.life /
        particle.maxLife;

      const fadeIn = Math.min(
        progress * 8,
        1,
      );

      const fadeOut = Math.min(
        (1 - progress) * 5,
        1,
      );

      const alpha =
        particle.alpha *
        fadeIn *
        fadeOut;

      if (alpha <= 0) {
        return;
      }

      const flicker =
        1 +
        Math.sin(
          time * 0.014 +
            particle.phase,
        ) *
          0.25;

      const size =
        particle.size *
        flicker;

      const glow =
        ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          size * 4,
        );

      glow.addColorStop(
        0,
        hexToRgba(
          theme.core,
          alpha,
        ),
      );

      glow.addColorStop(
        0.18,
        hexToRgba(
          theme.hot,
          alpha * 0.95,
        ),
      );

      glow.addColorStop(
        0.5,
        hexToRgba(
          theme.main,
          alpha * 0.65,
        ),
      );

      glow.addColorStop(
        1,
        hexToRgba(
          theme.outer,
          0,
        ),
      );

      ctx.beginPath();

      ctx.fillStyle = glow;

      ctx.arc(
        particle.x,
        particle.y,
        size * 4,
        0,
        Math.PI * 2,
      );

      ctx.fill();

      ctx.beginPath();

      ctx.fillStyle = hexToRgba(
        theme.hot,
        alpha * 0.8,
      );

      ctx.arc(
        particle.x,
        particle.y,
        Math.max(
          0.7,
          size * 0.65,
        ),
        0,
        Math.PI * 2,
      );

      ctx.fill();
    }

    function animate(time: number) {
      if (!running) {
        return;
      }

      ctx.clearRect(
        0,
        0,
        width,
        height,
      );

      drawBaseGlow();

      ctx.globalCompositeOperation =
        "lighter";

      drawFlameTongues(time);

      for (const particle of particles) {
        particle.life += 16;

        particle.phase += 0.025;

        particle.x +=
          particle.vx +
          Math.sin(
            time * 0.003 +
              particle.phase,
          ) *
            particle.sway *
            0.2;

        particle.y +=
          particle.vy;

        particle.vy *= 0.997;

        drawParticle(
          particle,
          time,
        );

        if (
          particle.life >=
            particle.maxLife ||
          particle.y < -25 ||
          particle.x < -35 ||
          particle.x > width + 35
        ) {
          resetParticle(particle);
        }
      }

      ctx.globalCompositeOperation =
        "source-over";

      animationFrame =
        requestAnimationFrame(
          animate,
        );
    }

    resize();
    seedParticles();

    const resizeObserver =
      new ResizeObserver(resize);

    resizeObserver.observe(canvas);

    const visibilityHandler =
      () => {
        if (
          document.visibilityState ===
          "hidden"
        ) {
          running = false;

          cancelAnimationFrame(
            animationFrame,
          );
        } else if (!running) {
          running = true;

          animationFrame =
            requestAnimationFrame(
              animate,
            );
        }
      };

    document.addEventListener(
      "visibilitychange",
      visibilityHandler,
    );

    animationFrame =
      requestAnimationFrame(
        animate,
      );

    return () => {
      running = false;

      cancelAnimationFrame(
        animationFrame,
      );

      resizeObserver.disconnect();

      document.removeEventListener(
        "visibilitychange",
        visibilityHandler,
      );
    };
  }, [role, captain]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />

      <div
        className="absolute inset-x-[3%] bottom-[-18%] h-[55%] blur-[24px]"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(255,55,0,.38) 0%, rgba(255,110,0,.2) 35%, transparent 74%)",
        }}
      />

      <div
        className="absolute inset-x-[18%] bottom-[-8%] h-[28%] blur-[13px]"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(255,190,35,.3) 0%, transparent 72%)",
        }}
      />

      {captain && (
        <div
          className="absolute inset-x-[8%] bottom-[-12%] h-[42%] blur-[28px]"
          style={{
            background:
              "radial-gradient(ellipse at center bottom, rgba(255,145,0,.2) 0%, transparent 72%)",
          }}
        />
      )}
    </div>
  );
}