import { useCallback, useEffect, useRef, useState } from "react";
import type { RunningState } from "./useWebsocket";
import type { Participant, User } from "./useDiscordSdk";
import { ParticipantAvatar } from "./ParticipantAvatar";

interface StandupProps {
  participants: Participant[];
  standupState: RunningState;
  currentUser: User;
  websocket: WebSocket | null;
}

export function Standup({
  participants,
  standupState,
  currentUser,
  websocket,
}: StandupProps) {
  const [completed, setCompleted] = useState<boolean>(false);
  const [localOffset, setLocalOffset] = useState<number>(
    standupState.currentOffset
  );
  const lastTick = useRef<number>(Date.now());
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    if (timeout.current != null) {
      clearTimeout(timeout.current);
    }

    lastTick.current = Date.now();
    setLocalOffset(standupState.currentOffset);
  }, [standupState]);

  useEffect(() => {
    if (completed) return;

    timeout.current = setTimeout(() => {
      const nextTick = Date.now();
      setLocalOffset(localOffset + (nextTick - lastTick.current));
      lastTick.current = nextTick;
    }, 250);
  }, [localOffset, completed]);

  const durationMs = standupState.duration * 1000;
  const currentIndex = Math.floor(localOffset / durationMs);
  const currentSpeakerId = standupState.members[currentIndex];
  const currentSpeakerTimeElapsed = localOffset - currentIndex * durationMs;
  const currentSpeaker = participants.find((p) => p.id === currentSpeakerId);

  useEffect(() => {
    if (currentSpeaker == null || currentIndex >= standupState.members.length) {
      setCompleted(true);
    }
  }, [currentSpeaker, currentIndex, standupState.members.length]);

  const onGoAgain = useCallback(() => {
    console.log("sending reset message...");
    websocket?.send(
      JSON.stringify({
        type: "reset",
      })
    );
  }, [websocket]);

  const currentSpeakerName =
    currentSpeaker?.nickname ??
    currentSpeaker?.global_name ??
    currentSpeaker?.username ??
    "Someone stinky";

  const nextSpeaker = participants.find(
    (p) => p.id === standupState.members[currentIndex + 1]
  );
  const nextSpeakerName =
    nextSpeaker?.nickname ?? nextSpeaker?.global_name ?? nextSpeaker?.username;

  if (completed) {
    return (
      <div className="standup">
        <h1>Standup over!</h1>
        <button onClick={onGoAgain}>Go again?</button>
      </div>
    );
  }

  return (
    <div className="standup">
      <h1>Standup</h1>
      <div className="standup__activeContainer">
        <h2>
          {currentUser.id === currentSpeakerId
            ? "You're up!"
            : `${currentSpeakerName} is up!`}
        </h2>
        {currentSpeaker != null ? (
          <ParticipantAvatar participant={currentSpeaker} size={128} />
        ) : null}
        <div>
          <span>
            Time left:{" "}
            {Math.floor((durationMs - currentSpeakerTimeElapsed) / 1000)}
          </span>
        </div>
        {nextSpeaker != null ? (
          <div>
            <ParticipantAvatar participant={nextSpeaker} size={32} />
            <span>Next up: {nextSpeakerName}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
