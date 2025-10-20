import { DiscordSDK, Events } from "@discord/embedded-app-sdk";
import { useEffect, useCallback, useRef, useState } from "react";

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

export function useDiscordSdk() {
    const [participants, setParticipants] = useState<{
        username: string;
        id: string;
    }[]>([]);

    const auth = useRef<{
        access_token: string;
        user: {
            username: string;
            discriminator: string;
            id: string;
        };
    } | null>(null);

    const init = useCallback(async () => {
        console.log("initializing discord sdk");
        await discordSdk.ready();
        const { code } = await discordSdk.commands.authorize({
            client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
            response_type: "code",
            state: "",
            prompt: "none",
            scope: [
            "identify",
            "guilds",
            "applications.commands"
            ],
        });

        console.log("fetching token");
        const response = await fetch("/api/token", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            code,
            }),
        });
        const { access_token } = await response.json();
        auth.current = await discordSdk.commands.authenticate({
            access_token,
        });
    }, []);

    useEffect(() => {
        (async () => {
            await init();
            console.log("subscribing to participants update");
            discordSdk.subscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, (update) => {
                console.log("participants update", update);
                setParticipants(update.participants);
            });
        })();
    }, [init]);

    return {
        participants,
        auth,
        discordSdk,
    };
}