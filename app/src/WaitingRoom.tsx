import { useCallback, useEffect, useState, useMemo } from "react";
import "./App.css";
import type { DiscordSDK } from "@discord/embedded-app-sdk";
import "./App.css";
import { type Participant, type User } from "./useDiscordSdk";
import type { PendingState } from "./useWebsocket";
import { ParticipantAvatar } from "./ParticipantAvatar";
import { Countdown } from "./Countdown";

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
  const [startCountdown, setStartCountdown] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(15);
  const isValidDuration = duration >= 5 && duration <= 60;

  const start = useCallback(async () => {
    setStartCountdown(true);
  }, []);

  const onCountdownComplete = useCallback(async () => {
    websocket?.send(
      JSON.stringify({
        type: "start",
        duration,
      })
    );
  }, [duration, websocket]);

  const leave = useCallback(async () => {
    websocket?.send(
      JSON.stringify({
        type: "leave",
        userId: currentUser.id,
      })
    );
  }, [currentUser.id, websocket]);

  const join = useCallback(async () => {
    websocket?.send(
      JSON.stringify({
        type: "join",
        userId: currentUser.id,
      })
    );
  }, [currentUser.id, websocket]);

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

  const activeParticipants = useMemo(
    () => participants.filter((p) => standupState.members.includes(p.id)),
    [participants, standupState.members]
  );
  const isActiveParticipant = useMemo(
    () => standupState.members.includes(currentUser.id),
    [currentUser.id, standupState.members]
  );

  if (startCountdown) {
    return <Countdown onCountdownComplete={onCountdownComplete} />;
  }

  return (
    <div className="waitingRoom">
      <div className="waitingRoom__content">
        <h1>{channelName != null ? `${channelName} Standup` : "Standup"}</h1>
        <div className="waitingRoom__controls">
          <div>Time per person (5-60 seconds)</div>
          <div className="waitingRoom__durationControls">
            <button
              className="waitingRoom__durationControl"
              onClick={() => setDuration((d) => Math.max(5, d - 1))}
              title="Decrease value"
              aria-label="Decrease value"
            >
              -
            </button>
            <input
              className="waitingRoom__durationInput"
              type="number"
              min="5"
              max="60"
              value={duration}
              onChange={(event) => setDuration(event.target.valueAsNumber)}
            />
            <button
              className="waitingRoom__durationControl"
              onClick={() => setDuration((d) => Math.min(60, d + 1))}
              title="Increase value"
              aria-label="Increase value"
            >
              +
            </button>
          </div>
          <button
            className="waitingRoom__startButton"
            onClick={start}
            disabled={activeParticipants.length === 0 || !isValidDuration}
          >
            Start it up!
          </button>
          {!isActiveParticipant && (
            <button className="waitingRoom__joinButton" onClick={join}>
              Join in!
            </button>
          )}
        </div>
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
                    onClick={leave}
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
