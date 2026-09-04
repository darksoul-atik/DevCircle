import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function AnimatedBackground() {
  return (
    <ParticlesProvider init={async (engine) => await loadSlim(engine)}>
      <Particles
        id="tsparticles"
        className="absolute inset-0 w-full h-full -z-10"
      options={{
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
          },
          modes: {
            grab: {
              distance: 140,
              links: {
                opacity: 0.15,
              },
            },
          },
        },
        particles: {
          color: {
            value: "#ea580c", // Tailwind's orange-600 (DevCircle accent)
          },
          links: {
            color: "#ea580c",
            distance: 150,
            enable: true,
            opacity: 0.1,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 0.5,
            straight: false,
          },
          number: {
            density: {
              enable: true,
            },
            value: 60,
          },
          opacity: {
            value: 0.2,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 2 },
          },
        },
        detectRetina: true,
      }}
    />
    </ParticlesProvider>
  );
}
