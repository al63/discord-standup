import { useReward } from "partycles";
import { useCallback, useEffect, useRef } from "react";

interface CompleteProps {
  websocket: WebSocket | null;
}

export function Complete({ websocket }: CompleteProps) {
  const { reward } = useReward("standup-complete", "confetti", {
    particleCount: 50,
    spread: 90,
    startVelocity: 20,
    elementSize: 20,
    lifetime: 150,
    physics: {
      gravity: 0.35,
      wind: 0,
      friction: 0.98,
    },
    effects: {
      flutter: true,
    },
    colors: ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3"],
  });
  const ranAnimation = useRef(false);

  useEffect(() => {
    if (ranAnimation.current === true) {
      return;
    }
    ranAnimation.current = true;
    reward();
  }, [reward]);

  const onGoAgain = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      websocket?.send(
        JSON.stringify({
          type: "reset",
        })
      );
    },
    [websocket]
  );

  return (
    <div id="standup-complete" className="standup__completed">
      <h1>Standup over!</h1>
      <button className="standup__completedButton" onClick={onGoAgain}>
        Go again?
      </button>
    </div>
  );
}
