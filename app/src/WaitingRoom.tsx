import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { type Participant, type User } from "./useDiscordSdk";
import type { DiscordSDK } from "@discord/embedded-app-sdk";
import type { StandupState } from "./App";
import { ParticipantAvatar } from "./ParticipantAvatar";

interface WaitingRoomProps {
  participants: Participant[];
  discordSdk: DiscordSDK;
  currentUser: User;
  onStart: (standupState: StandupState) => void;
  activeParticipants: Participant[];
}

export function WaitingRoom({
  participants,
  discordSdk,
  onStart,
  currentUser,
  activeParticipants,
}: WaitingRoomProps) {
  const [channelName, setChannelName] = useState<string | null>(null);
  const start = useCallback(async () => {
    console.log("starting", discordSdk.instanceId, activeParticipants);
    const res = await fetch("/api/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instanceId: discordSdk.instanceId,
        members: activeParticipants.map(
          (p) => p.nickname ?? p.global_name ?? p.username
        ),
        duration: 15,
      }),
    });

    if (res.status !== 200) {
      console.error("failed to start standup?");
      return;
    }

    // timer below will eventually start? idk make it better
  }, [activeParticipants, discordSdk.instanceId]);

  const sync = useCallback(async () => {
    const res = await fetch(`/api/sync?instanceId=${discordSdk.instanceId}`);
    if (res.status !== 200) {
      return setTimeout(sync, 1000);
    }

    const { state } = await res.json();
    onStart({
      type: "running",
      members: state.members,
      startedAt: new Date(state.startedAt),
      duration: state.duration ?? 30,
    });
  }, [discordSdk.instanceId, onStart]);

  useEffect(() => {
    setTimeout(sync, 1000);
  }, [discordSdk.instanceId, onStart, sync]);

  useEffect(() => {
    const fetchChannelName = async () => {
      if (discordSdk.channelId == null) return;
      const channel = await discordSdk.commands.getChannel({
        channel_id: discordSdk.channelId,
      });
      if (channel.name != null) {
        setChannelName(channel.name);
      }
    };

    fetchChannelName();
  }, [discordSdk]);

  return (
    <div className="waitingRoom">
      <div className="waitingRoom__content">
        <h1>{channelName != null ? `${channelName} Standup` : "Standup"}</h1>
        <button
          className="waitingRoom__startButton"
          onClick={start}
          disabled={participants.length === 0}
        >
          Start it up!
        </button>
        <div className="waitingRoom__activeParticipants">
          {activeParticipants.map((p) => (
            <div
              className="waitingRoom__activeParticipant"
              key={`${p.id}-active`}
            >
              <ParticipantAvatar participant={p} size={128} />
              <div>{p.nickname ?? p.global_name ?? p.username}</div>
              {p.id === currentUser.id ? (
                <>
                  <div>(you)</div>
                  <button
                    className="waitingRoom__leaveButton"
                    onClick={() => {}} // TODO
                    disabled={participants.length === 0}
                  >
                    leave
                  </button>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="waitingRoom__sidebar">
        <h3>In Voice</h3>
        {participants.map((p) => (
          <div className="waitingRoom__participant" key={p.id}>
            <ParticipantAvatar participant={p} size={64} />
            <div>{p.nickname ?? p.global_name ?? p.username}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
