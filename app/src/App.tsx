import { useState } from "react";
import "./App.css";
import { useDiscordSdk } from "./useDiscordSdk";
import { WaitingRoom } from "./WaitingRoom";
import { Standup } from "./Standup";

type Loading = {
  type: "loading";
};

type Pending = {
  type: "pending";
};

type Running = {
  type: "running";
  members: string[];
  startedAt: Date;
  duration: number;
};

export type StandupState = Loading | Pending | Running;

function App() {
  const [standupState, setStandupState] = useState<StandupState>({
    type: "loading",
  });
  const { participants, discordSdk } = useDiscordSdk(setStandupState);

  if (standupState.type === "loading") {
    return <div>Loading...</div>;
  } else if (standupState.type === "pending") {
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
