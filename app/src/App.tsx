import { useState } from "react";
import "./App.css";
import { useDiscordSdk } from "./useDiscordSdk";
import { type User } from "./useDiscordSdk";
import { WaitingRoom } from "./WaitingRoom";
import { Standup } from "./Standup";

type Loading = {
  type: "loading";
};

type Pending = {
  type: "pending";
  currentUser: User;
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
  const { participants, activeParticipants, discordSdk } =
    useDiscordSdk(setStandupState);

  if (standupState.type === "loading") {
    return <div>Loading...</div>;
  } else if (standupState.type === "pending") {
    return (
      <WaitingRoom
        participants={participants}
        activeParticipants={activeParticipants}
        discordSdk={discordSdk}
        currentUser={standupState.currentUser}
        onStart={setStandupState}
      />
    );
  } else {
    return <Standup standupState={standupState} />;
  }
}

export default App;
