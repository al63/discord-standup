import { useCallback, useState} from 'react'
import './App.css'
import { useDiscordSdk } from './useDiscordSdk';

interface StandupState {
  members: string[];
  startedAt: Date;
  duration: number;
}

function App() {
  // Stuff from the discord SDK. participants here = participants in the activity, not necessarily in the standup.
  const { participants, auth, discordSdk } = useDiscordSdk();

  const [standupState, setStandupState] = useState<StandupState | null>(null);

  const start = useCallback(async () => {
    if (auth == null) {
      console.log('no auth yet')
      return;
    }

    console.log("starting", discordSdk.instanceId, participants);
    const res = await fetch("/api/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "instanceId": discordSdk.instanceId,
        "members": participants, // just assuming right now all participants are members of the standup.
        "duration": 15,
      }),
    });

    const { state } = await res.json();
    setStandupState({
      members: state.members,
      startedAt: new Date(state.startedAt),
      duration: state.duration,
    });
  }, [auth, discordSdk.instanceId, participants]);

  return (
    <div>
      <h1>Standup</h1>
      <button onClick={start} disabled={auth == null}>
        Start
      </button>
      <h2>Who is in the activity?</h2>
      <pre>{JSON.stringify(participants, null, 2)}</pre>
      <h2>Standup state</h2>
      <pre>{JSON.stringify(standupState, null, 2)}</pre>
    </div>
  )
}

export default App
