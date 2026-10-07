"use client";

import { useEffect, useRef } from "react";

type RoleFlamesProps = {
  role: string;
  captain?: boolean;
};

type SmokeParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
  phase: number;
  rotation: number;
  rotationSpeed: number;
};

type SmokeTheme = {
  core: string;
  main: string;
  deep: string;
};

function getTheme(
  role: string,
  captain: boolean,
): SmokeTheme {
  const normalized = role
    .toLowerCase()
    .trim();

  let theme: SmokeTheme;

  if (
    normalized.includes("support") ||
    normalized.includes("utility")
  ) {
    theme = {
      core: "#d8ffe5",
      main: "#22d66f",
      deep: "#087a3b",
    };
  } else if (
    normalized.includes("sniper") ||
    normalized.includes("igl")
  ) {
    theme = {
      core: "#d8ecff",
      main: "#238cff",
      deep: "#0751a5",
    };
  } else if (
    normalized.includes("rusher") ||
    normalized.includes("entry") ||
    normalized.includes("fragger")
  ) {
    theme = {
      core: "#ffdcd6",
      main: "#ff3b30",
      deep: "#9d0904",
    };
  } else if (
    normalized.includes("bomber") ||
    normalized.includes("bomb")
  ) {
    theme = {
      core: "#fff4b8",
      main: "#ffb000",
      deep: "#d85a00",
    };
  } else {
    theme = {
      core: "#ffe8cf",
      main: "#ff7a18",
      deep: "#a92c00",
    };
  }

  return theme;
}

export default function RoleFlames({
  role,
  captain = false,
}: RoleFlamesProps) {
  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement =
      canvasRef.current;

    if (!canvasElement) {
      return;
    }

    const context =
      canvasElement.getContext("2d");

    if (!context) {
      return;
    }

    const canvas: HTMLCanvasElement =
      canvasElement;

    const ctx: CanvasRenderingContext2D =
      context;

    const theme = getTheme(
      role,
      captain,
    );

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let running = true;

    const particles: SmokeParticle[] =
      [];

    function hexToRgba(
      hex: string,
      alpha: number,
    ): string {
      const clean =
        hex.replace("#", "");

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
    ): SmokeParticle {
      const maxLife =
        1400 +
        Math.random() * 1500;

      const startX =
        width *
        (0.68 +
          Math.random() * 0.42);

      const startY =
        height *
        (-0.05 +
          Math.random() * 0.45);

      return {
        x: initial
          ? startX -
            Math.random() *
              width *
              0.55
          : startX,

        y: initial
          ? startY +
            Math.random() *
              height *
              0.55
          : startY,

        /*
         * TOP RIGHT -> BOTTOM LEFT
         */
        vx:
          -(
            0.16 +
            Math.random() * 0.32
          ),

        vy:
          0.12 +
          Math.random() * 0.26,

        life: initial
          ? Math.random() * maxLife
          : 0,

        maxLife,

        /*
         * Larger smoke clouds.
         */
        size:
          24 +
          Math.random() * 52,

        /*
         * Increased particle opacity.
         */
        alpha:
          0.08 +
          Math.random() * 0.12,

        phase:
          Math.random() *
          Math.PI *
          2,

        rotation:
          Math.random() *
          Math.PI *
          2,

        rotationSpeed:
          (Math.random() - 0.5) *
          0.002,
      };
    }

    function resetParticle(
      particle: SmokeParticle,
    ) {
      Object.assign(
        particle,
        createParticle(false),
      );
    }

    function seedParticles() {
      particles.length = 0;

      const count = captain
        ? 50
        : 40;

      for (
        let i = 0;
        i < count;
        i++
      ) {
        particles.push(
          createParticle(true),
        );
      }
    }

    function drawSmokeRibbon(
      time: number,
    ) {
      const steps = 15;

      for (
        let i = 0;
        i < steps;
        i++
      ) {
        const progress =
          i / (steps - 1);

        /*
         * TOP RIGHT
         *      \
         *       \
         *        \
         *         \
         *          BOTTOM LEFT
         */
        const baseX =
          width *
          (0.98 -
            progress * 1.15);

        const baseY =
          height *
          (-0.02 +
            progress * 1.05);

        const waveA =
          Math.sin(
            time * 0.0008 +
              i * 0.75,
          ) *
          width *
          0.055;

        const waveB =
          Math.sin(
            time * 0.0013 +
              i * 1.2,
          ) *
          height *
          0.035;

        const x =
          baseX + waveA;

        const y =
          baseY + waveB;

        const radius =
          width *
          (0.11 +
            Math.sin(
              time * 0.0007 +
                i * 0.9,
            ) *
              0.018);

        const centerDistance =
          Math.abs(
            progress - 0.5,
          );

        const edgeBias =
          0.55 +
          centerDistance *
            0.45;

        const gradient =
          ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            radius,
          );

        /*
         * Much more visible than before.
         */
        gradient.addColorStop(
          0,
          hexToRgba(
            theme.main,
            (captain
              ? 0.17
              : 0.12) *
              edgeBias,
          ),
        );

        gradient.addColorStop(
          0.28,
          hexToRgba(
            theme.main,
            (captain
              ? 0.11
              : 0.075) *
              edgeBias,
          ),
        );

        gradient.addColorStop(
          0.52,
          hexToRgba(
            theme.deep,
            (captain
              ? 0.075
              : 0.05) *
              edgeBias,
          ),
        );

        gradient.addColorStop(
          0.78,
          hexToRgba(
            theme.deep,
            0.025 *
              edgeBias,
          ),
        );

        gradient.addColorStop(
          1,
          hexToRgba(
            theme.deep,
            0,
          ),
        );

        ctx.fillStyle =
          gradient;

        ctx.beginPath();

        ctx.ellipse(
          x,
          y,
          radius,
          radius * 0.46,
          -0.75,
          0,
          Math.PI * 2,
        );

        ctx.fill();
      }
    }

    function drawParticle(
      particle: SmokeParticle,
      time: number,
    ) {
      const progress =
        particle.life /
        particle.maxLife;

      const fadeIn = Math.min(
        progress * 4,
        1,
      );

      const fadeOut = Math.min(
        (1 - progress) * 3,
        1,
      );

      const alpha =
        particle.alpha *
        fadeIn *
        fadeOut;

      if (alpha <= 0) {
        return;
      }

      const movement =
        particle.life * 0.001;

      const wobbleX =
        Math.sin(
          time * 0.001 +
            particle.phase +
            movement,
        ) *
        10;

      const wobbleY =
        Math.cos(
          time * 0.0008 +
            particle.phase,
        ) *
        7;

      const x =
        particle.x +
        wobbleX;

      const y =
        particle.y +
        wobbleY;

      const pulse =
        1 +
        Math.sin(
          time * 0.0015 +
            particle.phase,
        ) *
          0.15;

      const size =
        particle.size *
        pulse;

      ctx.save();

      ctx.translate(
        x,
        y,
      );

      ctx.rotate(
        particle.rotation,
      );

      const gradient =
        ctx.createRadialGradient(
          0,
          0,
          0,
          0,
          0,
          size,
        );

      /*
       * Bright center so the smoke
       * doesn't disappear against
       * dark player photos.
       */
      gradient.addColorStop(
        0,
        hexToRgba(
          theme.core,
          alpha * 0.72,
        ),
      );

      gradient.addColorStop(
        0.16,
        hexToRgba(
          theme.main,
          alpha * 0.58,
        ),
      );

      gradient.addColorStop(
        0.38,
        hexToRgba(
          theme.main,
          alpha * 0.32,
        ),
      );

      gradient.addColorStop(
        0.62,
        hexToRgba(
          theme.deep,
          alpha * 0.16,
        ),
      );

      gradient.addColorStop(
        0.82,
        hexToRgba(
          theme.deep,
          alpha * 0.05,
        ),
      );

      gradient.addColorStop(
        1,
        hexToRgba(
          theme.deep,
          0,
        ),
      );

      ctx.fillStyle =
        gradient;

      ctx.beginPath();

      ctx.ellipse(
        0,
        0,
        size,
        size * 0.48,
        0,
        0,
        Math.PI * 2,
      );

      ctx.fill();

      /*
       * Secondary soft wisp.
       */
      ctx.globalAlpha =
        0.7;

      ctx.beginPath();

      ctx.ellipse(
        size * 0.28,
        -size * 0.16,
        size * 0.62,
        size * 0.25,
        -0.25,
        0,
        Math.PI * 2,
      );

      ctx.fill();

      ctx.restore();
    }

    function drawEdgeHaze() {
      /*
       * TOP-RIGHT source.
       */
      const sourceGradient =
        ctx.createRadialGradient(
          width * 0.92,
          height * 0.04,
          0,
          width * 0.92,
          height * 0.04,
          width * 0.55,
        );

      sourceGradient.addColorStop(
        0,
        hexToRgba(
          theme.main,
          captain
            ? 0.2
            : 0.14,
        ),
      );

      sourceGradient.addColorStop(
        0.3,
        hexToRgba(
          theme.main,
          captain
            ? 0.09
            : 0.06,
        ),
      );

      sourceGradient.addColorStop(
        0.65,
        hexToRgba(
          theme.deep,
          0.025,
        ),
      );

      sourceGradient.addColorStop(
        1,
        hexToRgba(
          theme.main,
          0,
        ),
      );

      ctx.fillStyle =
        sourceGradient;

      ctx.fillRect(
        width * 0.45,
        0,
        width * 0.55,
        height * 0.5,
      );

      /*
       * BOTTOM-LEFT trail.
       */
      const trailGradient =
        ctx.createRadialGradient(
          width * 0.05,
          height * 0.9,
          0,
          width * 0.05,
          height * 0.9,
          width * 0.5,
        );

      trailGradient.addColorStop(
        0,
        hexToRgba(
          theme.deep,
          captain
            ? 0.11
            : 0.075,
        ),
      );

      trailGradient.addColorStop(
        0.35,
        hexToRgba(
          theme.deep,
          0.045,
        ),
      );

      trailGradient.addColorStop(
        0.7,
        hexToRgba(
          theme.deep,
          0.015,
        ),
      );

      trailGradient.addColorStop(
        1,
        hexToRgba(
          theme.deep,
          0,
        ),
      );

      ctx.fillStyle =
        trailGradient;

      ctx.fillRect(
        0,
        height * 0.55,
        width * 0.45,
        height * 0.45,
      );
    }

    function animate(
      time: number,
    ) {
      if (!running) {
        return;
      }

      ctx.clearRect(
        0,
        0,
        width,
        height,
      );

      ctx.globalCompositeOperation =
        "source-over";

      drawEdgeHaze();

      drawSmokeRibbon(time);

      for (
        const particle of particles
      ) {
        particle.life += 16;

        /*
         * Diagonal:
         * top-right -> bottom-left
         */
        particle.x +=
          particle.vx;

        particle.y +=
          particle.vy;

        /*
         * Organic movement.
         */
        particle.x +=
          Math.sin(
            time * 0.0015 +
              particle.phase,
          ) *
          0.12;

        particle.y +=
          Math.cos(
            time * 0.0011 +
              particle.phase,
          ) *
          0.06;

        particle.rotation +=
          particle.rotationSpeed;

        drawParticle(
          particle,
          time,
        );

        if (
          particle.life >=
            particle.maxLife ||
          particle.x < -100 ||
          particle.y >
            height + 100
        ) {
          resetParticle(
            particle,
          );
        }
      }

      animationFrame =
        requestAnimationFrame(
          animate,
        );
    }

    resize();

    seedParticles();

    const resizeObserver =
      new ResizeObserver(
        resize,
      );

    resizeObserver.observe(
      canvas,
    );

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
    </div>
  );
}