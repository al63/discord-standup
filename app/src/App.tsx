import { useEffect, useState } from "react";
import "./App.css";
import { useDiscordSdk } from "./useDiscordSdk";
import { WaitingRoom } from "./WaitingRoom";
import { Standup } from "./Standup";

export interface StandupState {
  members: string[];
  startedAt: Date;
  duration: number;
}

function App() {
  // Stuff from the discord SDK. participants here = participants in the activity, not necessarily in the standup.
  const { participants, discordSdk } = useDiscordSdk();
  const [standupState, setStandupState] = useState<StandupState | null>(null);

  if (standupState == null) {
    return (
      <WaitingRoom
        participants={participants}
        discordSdk={discordSdk}
        onStart={setStandupState}
      />
    );
  } else {
    return <Standup standupState={standupState} />;
  }
}

export default App;
