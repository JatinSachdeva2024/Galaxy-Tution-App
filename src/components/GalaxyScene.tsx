import "./GalaxyScene.css";

const STARS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 100}%`,
  top: `${(i * 23 + 11) % 100}%`,
  size: 1 + (i % 3),
  delay: `${(i % 12) * 0.35}s`,
  duration: `${1.8 + (i % 5) * 0.4}s`,
}));

const PLANETS = [
  { id: "p1", color: "#e8a87c", size: 28, left: "12%", top: "55%", ring: false, delay: "0s" },
  { id: "p2", color: "#7eb8da", size: 18, left: "72%", top: "28%", ring: true, delay: "-2s" },
  { id: "p3", color: "#c9b1ff", size: 14, left: "58%", top: "68%", ring: false, delay: "-4s" },
];

export default function GalaxyScene() {
  return (
    <div className="galaxy-scene" aria-hidden>
      <div className="galaxy-scene__nebula" />
      <div className="galaxy-scene__sun" />
      <div className="galaxy-scene__sun-glow" />

      {STARS.map((s) => (
        <span
          key={s.id}
          className="galaxy-scene__star"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}

      {PLANETS.map((p) => (
        <div
          key={p.id}
          className={`galaxy-scene__planet ${p.ring ? "galaxy-scene__planet--ringed" : ""}`}
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            background: `radial-gradient(circle at 35% 35%, ${p.color}, ${p.color}88 60%, ${p.color}44)`,
          }}
        />
      ))}

      <div className="galaxy-scene__shooting" />
    </div>
  );
}
