import { useEffect, useRef, useState } from "react";
import type { DiscordAuth } from "./useDiscordSdk";
import { DiscordSDK } from "@discord/embedded-app-sdk";

export type LoadingState = {
  type: "loading";
};

export type PendingState = {
  type: "pending";
  members: string[];
};

export type RunningState = {
  type: "running";
  members: string[];
  startedAt: Date;
  duration: number;
};

export type StandupState = LoadingState | PendingState | RunningState;

export function useStandupWebsocket(
  auth: DiscordAuth | null,
  discordSdk: DiscordSDK
) {
  const [standupState, setStandupState] = useState<StandupState>({
    type: "loading",
  });

  const websocket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (auth == null) {
      console.log("auth is null, not connecting to websocket");
      return;
    }

    console.log("connecting to websocket");
    websocket.current = new WebSocket(
      `wss://${import.meta.env.VITE_DISCORD_CLIENT_ID}.discordsays.com/api/ws/${discordSdk.instanceId}`
    );

    websocket.current.addEventListener("open", () => {
      console.log("websocket connection opened, sending join message");

      // opt in to standup by default on open
      websocket.current?.send(
        JSON.stringify({
          type: "join",
          userId: auth.user.id,
        })
      );
    });

    websocket.current.addEventListener("message", (event) => {
      const parsed = JSON.parse(event.data);
      console.log("ws message received:", parsed);

      if (parsed.type === "state") {
        if (parsed.state.startedAt != null) {
          setStandupState({
            type: "running",
            members: parsed.state.members,
            startedAt: new Date(parsed.state.startedAt),
            duration: parsed.state.duration,
          });
        } else {
          setStandupState({
            type: "pending",
            members: parsed.state.members,
          });
        }
      }
    });

    return () => {
      websocket.current?.close();
      websocket.current = null;
    };
  }, [discordSdk.instanceId, auth]);

  return {
    standupState,
    websocket: websocket.current,
  };
}
