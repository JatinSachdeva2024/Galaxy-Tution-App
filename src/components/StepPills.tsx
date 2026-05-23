import type { Step } from "../types";
import "./StepPills.css";

const STEPS: Step[] = ["capture", "edit", "preview"];

const LABELS: Record<Step, string> = {
  capture: "Photo",
  edit: "Edit",
  preview: "Notebook",
};

interface Props {
  current: Step;
}

export default function StepPills({ current }: Props) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <nav className="step-pills" aria-label="Progress">
      <div className="step-pills__track">
        {STEPS.map((step, i) => {
          const state =
            i === currentIndex ? "current" : i < currentIndex ? "done" : "upcoming";

          return (
            <div
              key={step}
              className={`step-pill step-pill--${state}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              {LABELS[step]}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
