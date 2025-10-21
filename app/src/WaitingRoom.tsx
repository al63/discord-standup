import { useCallback, useEffect } from "react";
import "./App.css";
import { type Participant } from "./useDiscordSdk";
import type { DiscordSDK } from "@discord/embedded-app-sdk";
import type { StandupState } from "./App";

interface WaitingRoomProps {
  participants: Participant[];
  discordSdk: DiscordSDK;
  onStart: (standupState: StandupState) => void;
}

export function WaitingRoom({
  participants,
  discordSdk,
  onStart,
}: WaitingRoomProps) {
  const start = useCallback(async () => {
    console.log("starting", discordSdk.instanceId, participants);
    const res = await fetch("/api/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instanceId: discordSdk.instanceId,
        members: participants.map(
          (p) => p.nickname ?? p.global_name ?? p.username
        ), // just assuming right now all participants are members of the standup.
        duration: 15,
      }),
    });

    if (res.status !== 200) {
      console.error("failed to start standup?");
      return;
    }

    // timer below will eventually start? idk make it better
  }, [discordSdk.instanceId, participants]);

  const sync = useCallback(async () => {
    const res = await fetch(`/api/sync?instanceId=${discordSdk.instanceId}`);
    if (res.status !== 200) {
      return setTimeout(sync, 1000);
    }

    const { state } = await res.json();
    onStart({
      members: state.members,
      startedAt: new Date(state.startedAt),
      duration: state.duration ?? 30,
    });
  }, [discordSdk.instanceId, onStart]);

  useEffect(() => {
    setTimeout(sync, 1000);
  }, [discordSdk.instanceId, onStart, sync]);

  return (
    <div>
      <h1>Standup</h1>
      <button onClick={start} disabled={participants.length === 0}>
        Start
      </button>
      <h2>Who is in the activity?</h2>
      <pre>{JSON.stringify(participants, null, 2)}</pre>
    </div>
  );
}
