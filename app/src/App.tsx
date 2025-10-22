import "./App.css";
import { useDiscordSdk } from "./useDiscordSdk";
import { WaitingRoom } from "./WaitingRoom";
import { useStandupWebsocket } from "./useWebsocket";
import { Standup } from "./Standup";
import { LoadingScreen } from "./LoadingScreen";

function App() {
  const { participants, discordSdk, auth } = useDiscordSdk();
  const { standupState, websocket } = useStandupWebsocket(auth, discordSdk);
  if (standupState.type === "loading" || auth == null) {
    return <LoadingScreen />;
  } else if (standupState.type === "pending") {
    return (
      <WaitingRoom
        participants={participants}
        standupState={standupState}
        discordSdk={discordSdk}
        currentUser={auth.user}
        websocket={websocket}
      />
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

export default App;
