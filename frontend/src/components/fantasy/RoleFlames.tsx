"use client";

import { useEffect, useRef } from "react";

type RoleFlamesProps = {
  role: string;
  captain?: boolean;
};

type SmokeTheme = {
  main: string;
  light: string;
  dark: string;
};

type Wisp = {
  offset: number;
  speed: number;
  width: number;
  length: number;
  phase: number;
  alpha: number;
  drift: number;
};

function getTheme(role: string): SmokeTheme {
  const normalized = role.toLowerCase().trim();

  if (
    normalized.includes("support") ||
    normalized.includes("utility")
  ) {
    return {
      main: "#22d66f",
      light: "#caffdc",
      dark: "#087a3b",
    };
  }

  if (
    normalized.includes("sniper") ||
    normalized.includes("igl")
  ) {
    return {
      main: "#238cff",
      light: "#d0e8ff",
      dark: "#0751a5",
    };
  }

  if (
    normalized.includes("rusher") ||
    normalized.includes("entry") ||
    normalized.includes("fragger")
  ) {
    return {
      main: "#ff3b30",
      light: "#ffd5d0",
      dark: "#9d0904",
    };
  }

  if (
    normalized.includes("bomber") ||
    normalized.includes("bomb")
  ) {
    return {
      main: "#ffb000",
      light: "#fff3b5",
      dark: "#d85a00",
    };
  }

  return {
    main: "#ff7a18",
    light: "#ffe2c5",
    dark: "#a92c00",
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

    const canvas: HTMLCanvasElement = canvasElement;
    const ctx: CanvasRenderingContext2D = context;

    const theme = getTheme(role);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let running = true;

    const wisps: Wisp[] = [];

    function hexToRgba(
      hex: string,
      alpha: number,
    ): string {
      const clean = hex.replace("#", "");

      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);

      return `rgba(${r}, ${g}, ${b}, ${Math.max(
        0,
        Math.min(1, alpha),
      )})`;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(
        1,
        Math.floor(width * dpr),
      );

      canvas.height = Math.max(
        1,
        Math.floor(height * dpr),
      );

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createWisps() {
      wisps.length = 0;

      /*
       * More wisps, but each one remains thin
       * and irregular instead of becoming a blob.
       */
      const count = captain ? 19 : 15;

      for (let i = 0; i < count; i++) {
        wisps.push({
          offset: Math.random(),
          speed:
            0.000025 +
            Math.random() * 0.000035,

          width:
            9 +
            Math.random() * 20,

          length:
            0.18 +
            Math.random() * 0.26,

          phase:
            Math.random() *
            Math.PI *
            2,

          /*
           * Increased substantially.
           */
          alpha:
            0.075 +
            Math.random() * 0.065,

          drift:
            10 +
            Math.random() * 24,
        });
      }
    }

    function drawWisp(
      wisp: Wisp,
      time: number,
    ) {
      const progress =
        (wisp.offset +
          time * wisp.speed) %
        1.25;

      if (progress > 1) {
        return;
      }

      /*
       * TOP RIGHT -> BOTTOM LEFT
       */
      const centerX =
        width *
        (0.98 -
          progress * 1.05);

      const centerY =
        height *
        (-0.04 +
          progress * 1.08);

      /*
       * Organic movement.
       */
      const wave =
        Math.sin(
          time * 0.0007 +
            wisp.phase +
            progress * 9,
        ) *
        wisp.drift;

      const x = centerX + wave;

      const y =
        centerY +
        Math.cos(
          time * 0.0009 +
            wisp.phase,
        ) *
          10;

      /*
       * Fade the ends, but keep the
       * middle very visible.
       */
      const fadeIn = Math.min(
        progress / 0.1,
        1,
      );

      const fadeOut = Math.min(
        (1 - progress) / 0.14,
        1,
      );

      const lifeAlpha =
        fadeIn * fadeOut;

      if (lifeAlpha <= 0) {
        return;
      }

      const widthMultiplier =
        0.8 +
        Math.sin(
          time * 0.001 +
            wisp.phase,
        ) *
          0.2;

      const strokeWidth =
        wisp.width *
        widthMultiplier;

      /*
       * Direction of the smoke.
       */
      const angle =
        Math.PI * 0.75 +
        Math.sin(
          time * 0.0005 +
            wisp.phase,
        ) *
          0.1;

      const gradientLength =
        Math.min(width, height) *
        wisp.length;

      const startX =
        x -
        Math.cos(angle) *
          gradientLength *
          0.5;

      const startY =
        y -
        Math.sin(angle) *
          gradientLength *
          0.5;

      const endX =
        x +
        Math.cos(angle) *
          gradientLength *
          0.5;

      const endY =
        y +
        Math.sin(angle) *
          gradientLength *
          0.5;

      const gradient =
        ctx.createLinearGradient(
          startX,
          startY,
          endX,
          endY,
        );

      const strength =
        lifeAlpha *
        wisp.alpha *
        (captain ? 1.35 : 1);

      /*
       * Stronger color core.
       */
      gradient.addColorStop(
        0,
        hexToRgba(
          theme.dark,
          0,
        ),
      );

      gradient.addColorStop(
        0.12,
        hexToRgba(
          theme.dark,
          strength * 0.35,
        ),
      );

      gradient.addColorStop(
        0.32,
        hexToRgba(
          theme.main,
          strength * 1.15,
        ),
      );

      gradient.addColorStop(
        0.5,
        hexToRgba(
          theme.light,
          strength * 1.15,
        ),
      );

      gradient.addColorStop(
        0.66,
        hexToRgba(
          theme.main,
          strength * 0.95,
        ),
      );

      gradient.addColorStop(
        0.84,
        hexToRgba(
          theme.dark,
          strength * 0.35,
        ),
      );

      gradient.addColorStop(
        1,
        hexToRgba(
          theme.dark,
          0,
        ),
      );

      ctx.save();

      ctx.globalCompositeOperation = "screen";

      ctx.lineCap = "round";

      /*
       * LARGE SOFT OUTER SMOKE
       *
       * This is what makes the effect
       * visible without looking like
       * individual particles.
       */
      ctx.strokeStyle = gradient;

      ctx.lineWidth =
        strokeWidth * 4.5;

      ctx.globalAlpha = 0.42;

      ctx.beginPath();

      const curveAmount =
        Math.sin(
          time * 0.0006 +
            wisp.phase,
        ) *
        24;

      ctx.moveTo(
        startX,
        startY,
      );

      ctx.quadraticCurveTo(
        x + curveAmount,
        y -
          curveAmount *
            0.4,
        endX,
        endY,
      );

      ctx.stroke();

      /*
       * MAIN SMOKE BODY
       */
      ctx.globalAlpha = 0.95;

      ctx.lineWidth =
        strokeWidth;

      ctx.beginPath();

      ctx.moveTo(
        startX,
        startY,
      );

      ctx.quadraticCurveTo(
        x + curveAmount,
        y -
          curveAmount *
            0.4,
        endX,
        endY,
      );

      ctx.stroke();

      /*
       * THIN HOT CENTER
       *
       * Gives the smoke definition
       * without turning it into fire.
       */
      const coreGradient =
        ctx.createLinearGradient(
          startX,
          startY,
          endX,
          endY,
        );

      coreGradient.addColorStop(
        0,
        hexToRgba(
          theme.main,
          0,
        ),
      );

      coreGradient.addColorStop(
        0.35,
        hexToRgba(
          theme.main,
          strength * 0.55,
        ),
      );

      coreGradient.addColorStop(
        0.52,
        hexToRgba(
          theme.light,
          strength * 0.8,
        ),
      );

      coreGradient.addColorStop(
        0.7,
        hexToRgba(
          theme.main,
          strength * 0.45,
        ),
      );

      coreGradient.addColorStop(
        1,
        hexToRgba(
          theme.main,
          0,
        ),
      );

      ctx.strokeStyle =
        coreGradient;

      ctx.lineWidth =
        Math.max(
          2,
          strokeWidth * 0.22,
        );

      ctx.globalAlpha = 0.8;

      ctx.beginPath();

      ctx.moveTo(
        startX,
        startY,
      );

      ctx.quadraticCurveTo(
        x +
          curveAmount *
            0.7,
        y -
          curveAmount *
            0.35,
        endX,
        endY,
      );

      ctx.stroke();

      ctx.restore();
    }

    function drawAtmosphericTrail(
      time: number,
    ) {
      /*
       * Broad diagonal atmosphere.
       */
      const gradient =
        ctx.createLinearGradient(
          width * 0.94,
          height * 0.02,
          width * 0.02,
          height * 0.96,
        );

      const strength =
        captain ? 0.115 : 0.085;

      gradient.addColorStop(
        0,
        hexToRgba(
          theme.main,
          strength,
        ),
      );

      gradient.addColorStop(
        0.18,
        hexToRgba(
          theme.main,
          strength * 0.8,
        ),
      );

      gradient.addColorStop(
        0.4,
        hexToRgba(
          theme.main,
          strength * 0.52,
        ),
      );

      gradient.addColorStop(
        0.62,
        hexToRgba(
          theme.dark,
          strength * 0.3,
        ),
      );

      gradient.addColorStop(
        0.82,
        hexToRgba(
          theme.dark,
          strength * 0.12,
        ),
      );

      gradient.addColorStop(
        1,
        hexToRgba(
          theme.dark,
          0,
        ),
      );

      const drift =
        Math.sin(
          time * 0.0004,
        ) * 12;

      ctx.save();

      ctx.globalCompositeOperation =
        "screen";

      ctx.translate(
        drift,
        -drift * 0.4,
      );

      ctx.fillStyle =
        gradient;

      ctx.globalAlpha = 0.9;

      ctx.beginPath();

      ctx.moveTo(
        width * 0.46,
        0,
      );

      ctx.lineTo(
        width,
        0,
      );

      ctx.lineTo(
        width,
        height * 0.42,
      );

      ctx.lineTo(
        width * 0.16,
        height,
      );

      ctx.lineTo(
        0,
        height,
      );

      ctx.lineTo(
        width * 0.35,
        height * 0.48,
      );

      ctx.closePath();

      ctx.fill();

      ctx.restore();
    }

    function drawFineSmoke(
      time: number,
    ) {
      /*
       * Fine wisps break up the main
       * ribbons and make the smoke
       * feel less geometric.
       */
      const count = captain ? 11 : 8;

      for (let i = 0; i < count; i++) {
        const phase =
          i * 1.8 +
          role.length;

        const progress =
          (time * 0.000025 +
            i / count) %
          1;

        const baseX =
          width *
          (0.98 -
            progress * 1.04);

        const baseY =
          height *
          (-0.03 +
            progress * 1.05);

        const wave =
          Math.sin(
            time * 0.001 +
              phase,
          ) *
          34;

        const x =
          baseX + wave;

        const y =
          baseY +
          Math.cos(
            time * 0.0008 +
              phase,
          ) *
            16;

        const length =
          Math.min(width, height) *
          (0.13 +
            i * 0.01);

        const gradient =
          ctx.createLinearGradient(
            x,
            y,
            x - length,
            y + length,
          );

        const alpha =
          captain ? 0.065 : 0.045;

        gradient.addColorStop(
          0,
          hexToRgba(
            theme.light,
            alpha,
          ),
        );

        gradient.addColorStop(
          0.3,
          hexToRgba(
            theme.main,
            alpha * 0.9,
          ),
        );

        gradient.addColorStop(
          0.7,
          hexToRgba(
            theme.main,
            alpha * 0.45,
          ),
        );

        gradient.addColorStop(
          1,
          hexToRgba(
            theme.main,
            0,
          ),
        );

        ctx.save();

        ctx.globalCompositeOperation =
          "screen";

        ctx.strokeStyle =
          gradient;

        ctx.lineWidth =
          1.5 +
          i * 0.3;

        ctx.lineCap = "round";

        ctx.beginPath();

        ctx.moveTo(
          x,
          y,
        );

        ctx.bezierCurveTo(
          x -
            length * 0.2,
          y +
            length * 0.1,
          x -
            length * 0.55,
          y +
            length * 0.18,
          x - length,
          y + length,
        );

        ctx.stroke();

        ctx.restore();
      }
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

      drawAtmosphericTrail(time);

      drawFineSmoke(time);

      for (const wisp of wisps) {
        drawWisp(
          wisp,
          time,
        );
      }

      animationFrame =
        requestAnimationFrame(
          animate,
        );
    }

    resize();

    createWisps();

    const resizeObserver =
      new ResizeObserver(resize);

    resizeObserver.observe(canvas);

    const visibilityHandler = () => {
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
