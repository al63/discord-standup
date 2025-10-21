import { DiscordSDK, Events } from "@discord/embedded-app-sdk";
import { useEffect, useCallback, useRef, useState } from "react";
import type { StandupState } from "./App";

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

export interface Participant {
  username: string;
  id: string;
  nickname?: string;
  global_name?: string | null;
}

/*
returned by authenticate, idk if we need this

export interface DiscordAuth {
  access_token: string;
  user: {
    username: string;
    discriminator: string;
    id: string;
  };
}
  */

export function useDiscordSdk(
  setInitState: (standupState: StandupState) => void
) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const ranInit = useRef(false);

  useEffect(() => {
    if (ranInit.current === true) {
      return;
    }
    ranInit.current = true;

    (async () => {
      await discordSdk.ready();
      const { code } = await discordSdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: ["identify", "guilds", "applications.commands"],
      });

      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          instanceId: discordSdk.instanceId,
        }),
      });
      const { access_token, state } = await response.json();
      await discordSdk.commands.authenticate({
        access_token,
      });

      setInitState(
        state != null
          ? {
              type: "running",
              members: state.members,
              startedAt: new Date(state.startedAt),
              duration: state.duration ?? 30,
            }
          : {
              type: "pending",
            }
      );
      discordSdk.subscribe(
        Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE,
        (update) => {
          setParticipants(update.participants);
        }
      );
    })();
  }, [setInitState]);

  return {
    participants,
    discordSdk,
  };
}
