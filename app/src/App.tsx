import "./App.css";
import { useDiscordSdk } from "./useDiscordSdk";
import { WaitingRoom } from "./WaitingRoom";
import { useStandupWebsocket } from "./useWebsocket";

function App() {
  const { participants, discordSdk, auth } = useDiscordSdk();
  const { standupState, websocket } = useStandupWebsocket(auth, discordSdk);
  if (standupState.type === "loading" || auth == null) {
    return <div>Loading...</div>;
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
  }

  return null;
}

export default App;
