import { useCallback, useEffect, useState } from "react";
import "./App.css";
import type { DiscordSDK } from "@discord/embedded-app-sdk";
import "./App.css";
import { type Participant, type User } from "./useDiscordSdk";
import type { PendingState } from "./useWebsocket";
import { ParticipantAvatar } from "./ParticipantAvatar";

interface WaitingRoomProps {
  participants: Participant[];
  standupState: PendingState;
  discordSdk: DiscordSDK;
  currentUser: User;
  websocket: WebSocket | null;
}

export function WaitingRoom({
  participants,
  standupState,
  discordSdk,
  currentUser,
  websocket,
}: WaitingRoomProps) {
  const [channelName, setChannelName] = useState<string | null>(null);
  const start = useCallback(async () => {
    websocket?.send(
      JSON.stringify({
        type: "start",
        duration: 15,
      })
    );
  }, [websocket]);

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

  const activeParticipants = participants.filter((p) =>
    standupState.members.includes(p.id)
  );

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
