import "./App.css";
import { type Participant } from "./useDiscordSdk";


export function ParticipantAvatar({participant, size}: {participant: Participant, size: number}) {
return (
  <img
    className="participantAvatar"
    src={
      participant.avatar != null
        ? `https://cdn.discordapp.com/avatars/${participant.id}/${participant.avatar}.png?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${
            (BigInt(participant.id) >> 22n) % 6n
          }.png`
    }
    alt="avatar"
    width={size}
    height={size}
  />
);
}
