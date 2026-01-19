import { useCallback, useEffect } from "react";
import Particles from "@tsparticles/react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

function ParticlesBG() {
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    });
  }, []);

  const particlesLoaded = useCallback(async () => {}, []);

  return (
    <Particles
      id="tsparticles"
      particlesLoaded={particlesLoaded}
      options={{
        fullScreen: { enable: false },
        background: { color: "transparent" },
        fpsLimit: 60,
        particles: {
          number: { value: 40 },
          color: { value: "#4ade80" },
          shape: { type: "circle" },
          opacity: { value: 0.4 },
          size: { value: { min: 1, max: 5 } },
          move: { enable: true, speed: 0.6 },
          links: {
            enable: true,
            color: "#10b981",
            distance: 120,
            opacity: 0.3,
          },
        },
        detectRetina: true,
      }}
      className="absolute inset-0 -z-10 w-full h-full"
    />
  );
}

export default ParticlesBG;
