import "./App.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReward } from "partycles";
import type { StandupState } from "./useWebsocket";

interface Popcorn {
  [id: number]: { x: number; y: number };
}

function Popcorn({
  id,
  style,
  playAudio,
}: {
  id: string;
  style: React.CSSProperties;
  playAudio: boolean;
}) {
  // @ts-expect-error the emoji animation config is documented wrong
  const { reward } = useReward(`popcorn-${id}`, "emoji", {
    emojis: ["🍿"],
    particleCount: 1,
  });
  const ranReward = useRef(false);

  useEffect(() => {
    if (ranReward.current) {
      return;
    }

    ranReward.current = true;
    reward();
    if (playAudio) {
      new Audio("pop.mp3").play();
    }
  }, [reward, playAudio]);

  return <div id={`popcorn-${id}`} className="popcorn" style={style} />;
}

export function PopcornContainer({
  websocket,
  standupState,
}: {
  standupState: StandupState;
  websocket: WebSocket | null;
}) {
  const id = useRef(0);
  const [popcorn, setPopcorn] = useState<Popcorn>({});
  const init = useRef(false);

  const handlePopcorn = useCallback(({ x, y }: { x: number; y: number }) => {
    const currentId = id.current;
    const boundingRect = document.body.getBoundingClientRect();
    setPopcorn((popcorn) => {
      return {
        ...popcorn,
        [currentId]: { x: x * boundingRect.width, y: y * boundingRect.height },
      };
    });
    setTimeout(() => {
      setPopcorn((popcorn) => {
        const newPopcorn = { ...popcorn };
        delete newPopcorn[currentId];
        return newPopcorn;
      });
    }, 5000);
    id.current++;
  }, []);

  useEffect(() => {
    if (init.current === true) {
      return;
    }

    if (websocket == null) {
      return;
    }

    init.current = true;
    document.body.addEventListener("click", (e) => {
      const boundingRect = document.body.getBoundingClientRect();
      websocket?.send(
        JSON.stringify({
          type: "popcorn",
          x: (e.clientX / boundingRect.width).toFixed(2),
          y: (e.clientY / boundingRect.height).toFixed(2),
        })
      );
    });

    websocket?.addEventListener("message", (event) => {
      const parsed = JSON.parse(event.data);

      if (parsed.type === "popcorn") {
        handlePopcorn({ x: parsed.x, y: parsed.y });
      }
    });
  }, [handlePopcorn, websocket]);

  return (
    <>
      {Object.entries(popcorn).map(([id, { x, y }]) => (
        <Popcorn
          id={id}
          key={id}
          style={{ left: x, top: y }}
          playAudio={standupState.type !== "running"}
        />
      ))}
    </>
  );
}
