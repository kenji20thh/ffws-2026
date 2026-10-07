"use client";

import { useEffect, useId, useMemo } from "react";
import { tsParticles } from "@tsparticles/engine";
import { loadFirePreset } from "@tsparticles/preset-fire";

type Role = string;

interface RoleFlamesProps {
  role: Role;
  captain?: boolean;
}

type FlameTheme = {
  primary: string;
  secondary: string;
  tertiary: string;
  intensity: number;
};

function getFlameTheme(role: Role, captain: boolean): FlameTheme {
  const normalized = role.toLowerCase();

  if (captain) {
    return {
      primary: "#fff7c2",
      secondary: "#ffb000",
      tertiary: "#ff4d00",
      intensity: 1.35,
    };
  }

  if (
    normalized.includes("rusher") ||
    normalized.includes("entry") ||
    normalized.includes("fragger")
  ) {
    return {
      primary: "#fff0b3",
      secondary: "#ff7a00",
      tertiary: "#ff2600",
      intensity: 1.15,
    };
  }

  if (
    normalized.includes("sniper") ||
    normalized.includes("awper") ||
    normalized.includes("igl")
  ) {
    return {
      primary: "#ffffff",
      secondary: "#ffb000",
      tertiary: "#ff5a1f",
      intensity: 0.9,
    };
  }

  if (
    normalized.includes("support") ||
    normalized.includes("utility")
  ) {
    return {
      primary: "#fff8d6",
      secondary: "#ffb84d",
      tertiary: "#ff5a1f",
      intensity: 0.82,
    };
  }

  return {
    primary: "#fff1bd",
    secondary: "#ff8a00",
    tertiary: "#ff3d00",
    intensity: 1,
  };
}

export default function RoleFlames({
  role,
  captain = false,
}: RoleFlamesProps) {
  const generatedId = useId();

  const particleId = useMemo(
    () =>
      `role-flames-${generatedId
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .toLowerCase()}`,
    [generatedId],
  );

  const theme = useMemo(
    () => getFlameTheme(role, captain),
    [role, captain],
  );

  useEffect(() => {
    let destroyed = false;

    let container:
      | Awaited<ReturnType<typeof tsParticles.load>>
      | undefined;

    async function start() {
      try {
        await loadFirePreset(tsParticles);

        if (destroyed) {
          return;
        }

        container = await tsParticles.load({
          id: particleId,

          options: {
            fullScreen: {
              enable: false,
            },

            detectRetina: true,

            fpsLimit: captain ? 60 : 45,

            background: {
              color: {
                value: "transparent",
              },
            },

            particles: {
              number: {
                value: Math.round(26 * theme.intensity),

                density: {
                  enable: false,
                },
              },

              color: {
                value: [
                  theme.primary,
                  theme.secondary,
                  theme.tertiary,
                ],
              },

              opacity: {
                value: {
                  min: 0.15,
                  max: captain ? 0.95 : 0.78,
                },

                animation: {
                  enable: true,
                  speed: captain ? 2.8 : 2.2,
                  sync: false,
                  startValue: "max",
                  destroy: "min",
                },
              },

              size: {
                value: {
                  min: captain ? 2 : 1.5,
                  max: captain ? 7 : 5,
                },

                animation: {
                  enable: true,
                  speed: captain ? 5 : 3.5,
                  sync: false,
                  startValue: "min",
                  destroy: "max",
                },
              },

              move: {
                enable: true,

                direction: "top",

                random: true,

                straight: false,

                speed: {
                  min: captain ? 1.6 : 1.1,
                  max: captain ? 4.2 : 3.2,
                },

                drift: {
                  min: -0.8,
                  max: 0.8,
                },

                outModes: {
                  default: "destroy",
                },

                vibrate: false,
              },

              shape: {
                type: "circle",
              },

              shadow: {
                enable: true,

                color: theme.tertiary,

                blur: captain ? 14 : 10,

                offset: {
                  x: 0,
                  y: 2,
                },
              },

              life: {
                duration: {
                  value: {
                    min: 0.45,
                    max: captain ? 1.35 : 1.05,
                  },
                },

                count: 1,
              },

              links: {
                enable: false,
              },
            },

            emitters: {
              direction: "top",

              life: {
                count: 0,
                duration: 0.1,
                delay: 0,
              },

              rate: {
                quantity: captain ? 5 : 3,

                delay: {
                  value: captain ? 0.08 : 0.12,
                },
              },

              size: {
                width: 100,
                height: 0,
              },

              position: {
                x: {
                  min: 12,
                  max: 88,
                },

                y: 100,
              },
            },

            interactivity: {
              detectsOn: "window",

              events: {
                resize: true,
              },
            },

            preset: "fire",
          },
        });

        if (destroyed) {
          container?.destroy();
          container = undefined;
        }
      } catch (error) {
        console.error(
          "Failed to initialize role flames:",
          error,
        );
      }
    }

    start();

    return () => {
      destroyed = true;

      if (container) {
        container.destroy();
        container = undefined;
      }

      const existing = document.getElementById(particleId);

      if (existing) {
        existing.remove();
      }
    };
  }, [particleId, theme, captain]);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      <div
        id={particleId}
        className="absolute inset-x-0 bottom-0 h-[58%] w-full"
        style={{
          maskImage:
            "linear-gradient(to top, black 0%, black 45%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, black 45%, transparent 100%)",
        }}
      />

      <div
        className="absolute inset-x-[8%] bottom-0 h-[35%] opacity-70 blur-[18px]"
        style={{
          background: `radial-gradient(
            ellipse at center bottom,
            ${theme.tertiary} 0%,
            ${theme.secondary} 28%,
            transparent 72%
          )`,
        }}
      />

      {captain && (
        <div
          className="absolute inset-x-[12%] bottom-0 h-[22%] opacity-80 blur-[10px]"
          style={{
            background: `radial-gradient(
              ellipse at center bottom,
              ${theme.primary} 0%,
              ${theme.secondary} 30%,
              transparent 70%
            )`,
          }}
        />
      )}
    </div>
  );
}