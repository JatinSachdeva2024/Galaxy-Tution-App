import PixelTransition from "./PixelTransition/PixelTransition";
import GalaxyScene from "./GalaxyScene";
import "./GalaxyTitleCard.css";

export default function GalaxyTitleCard() {
  return (
    <PixelTransition
      firstContent={
        <div className="galaxy-title-card">
          <span className="galaxy-title-card__glow" aria-hidden />
          <h1 className="galaxy-title-card__name">Galaxy</h1>
        </div>
      }
      secondContent={<GalaxyScene />}
      gridSize={8}
      pixelColor="#0a0a0a"
      once={false}
      animationStepDuration={0.4}
      className="galaxy-pixel-card"
      style={{ width: "100%", height: "128px" }}
    />
  );
}
