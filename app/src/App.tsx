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
import type { DiscordSDK } from "@discord/embedded-app-sdk";
import { PopcornContainer } from "./Popcorn";
import { Complete } from "./Complete";

function App({
  standupState,
  setStandupState,
  participants,
  discordSdk,
  auth,
  websocket,
}: {
  standupState: StandupState;
  setStandupState: (state: StandupState) => void;
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
  } else if (standupState.type === "completed") {
    return <Complete websocket={websocket} />;
  } else {
    return (
      <Standup
        participants={participants}
        standupState={standupState}
        setStandupState={setStandupState}
        currentUser={auth.user}
        websocket={websocket}
      />
    );
  }
}

const AppContainer = () => {
  const { participants, discordSdk, auth } = useDiscordSdk();
  const { standupState, setStandupState, websocket } = useStandupWebsocket(
    auth,
    discordSdk
  );

  const props = {
    participants,
    discordSdk,
    auth,
    standupState,
    websocket,
    setStandupState,
  };

  return (
    <>
      <PopcornContainer websocket={websocket} />
      <App {...props} />
    </>
  );
};

export default AppContainer;
