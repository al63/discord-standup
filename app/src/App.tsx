import "./App.css";
import {
  useDiscordSdk,
  type DiscordAuth,
  type Participant,
} from "./useDiscordSdk";
import { WaitingRoom } from "./WaitingRoom";
import { useStandupWebsocket, type StandupState } from "./useWebsocket";
import { Standup } from "./Standup";
import { LoadingScreen } from "./LoadingScreen";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReward } from "partycles";
import type { DiscordSDK } from "@discord/embedded-app-sdk";
interface Popcorn {
  [id: number]: { x: number; y: number };
}

function Popcorn({ id, style }: { id: string; style: React.CSSProperties }) {
  // @ts-expect-error the emoji animation config is documented wrong
  const { reward } = useReward(`popcorn-${id}`, "emoji", {
    emojis: ["🍿"],
    particleCount: 1,
  });

  useEffect(() => {
    reward();
  }, [reward]);

  return <div id={`popcorn-${id}`} className="popcorn" style={style} />;
}

function PopcornContainer({ websocket }: { websocket: WebSocket | null }) {
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
    }, 1000);
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
        <Popcorn id={id} key={id} style={{ left: x, top: y }} />
      ))}
    </>
  );
  return null;
}

function App({
  standupState,
  participants,
  discordSdk,
  auth,
  websocket,
}: {
  standupState: StandupState;
  participants: Participant[];
  discordSdk: DiscordSDK;
  auth: DiscordAuth | null;
  websocket: WebSocket | null;
}) {
  if (standupState.type === "loading" || auth == null) {
    return <LoadingScreen />;
  } else if (standupState.type === "pending") {
    return (
      <>
        <WaitingRoom
          participants={participants}
          standupState={standupState}
          discordSdk={discordSdk}
          currentUser={auth.user}
          websocket={websocket}
        />
      </>
    );
  } else {
    return (
      <Standup
        participants={participants}
        standupState={standupState}
        currentUser={auth.user}
        websocket={websocket}
      />
    );
  }
}

const AppContainer = () => {
  const { participants, discordSdk, auth } = useDiscordSdk();
  const { standupState, websocket } = useStandupWebsocket(auth, discordSdk);

  const props = {
    participants,
    discordSdk,
    auth,
    standupState,
    websocket,
  };
  return (
    <>
      <PopcornContainer websocket={websocket} />
      <App {...props} />
    </>
  );
};

export default AppContainer;
