import "./App.css";
import { useDiscordSdk } from "./useDiscordSdk";
import { WaitingRoom } from "./WaitingRoom";
import { useStandupWebsocket } from "./useWebsocket";
import { Standup } from "./Standup";
import { LoadingScreen } from "./LoadingScreen";
import { useEffect, useRef, useState } from "react";

interface Popcorn {
  [id: number]: { x: number; y: number };
}

function PopcornContainer() {
  const id = useRef(0);
  const [popcorn, setPopcorn] = useState<Popcorn>({});
  const init = useRef(false);

  useEffect(() => {
    if (init.current === true) {
      return;
    }

    init.current = true;
    document.body.addEventListener("click", (e) => {
      console.log(e.clientX, e.clientY);
      setPopcorn((popcorn) => {
        return {
          ...popcorn,
          [id.current]: { x: e.clientX, y: e.clientY },
        };
      });
      id.current++;
    });
  }, [popcorn]);

  /*
  return (
    <>
      {Object.entries(popcorn).map(([id, { x, y }]) => (
        <div key={id} className="popcorn" style={{ left: x, top: y }} />
      ))}
    </>
  );
  */
  return null;
}

function App() {
  const { participants, discordSdk, auth } = useDiscordSdk();
  const { standupState, websocket } = useStandupWebsocket(auth, discordSdk);

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
  return (
    <>
      <PopcornContainer />
      <App />
    </>
  );
};

export default AppContainer;
