import { DiscordSDK, Events } from "@discord/embedded-app-sdk";
import { useEffect, useRef, useState } from "react";

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

export interface Participant {
  username: string;
  id: string;
  nickname?: string;
  global_name?: string | null;
  avatar?: string | null;
}

export interface User {
  username: string;
  discriminator: string;
  id: string;
  public_flags: number;
  avatar?: string | null | undefined;
  global_name?: string | null | undefined;
}

export interface DiscordAuth {
  access_token: string;
  user: User;
}

export function useDiscordSdk() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [auth, setAuth] = useState<DiscordAuth | null>(null);
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
      const { access_token } = await response.json();
      const auth = await discordSdk.commands.authenticate({
        access_token,
      });
      setAuth(auth);

      discordSdk.subscribe(
        Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE,
        (update) => {
          setParticipants(update.participants);
        }
      );
    })();
  }, []);

  return {
    participants,
    discordSdk,
    auth,
  };
}
