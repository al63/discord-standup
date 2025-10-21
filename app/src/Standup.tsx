import type { RunningState } from "./useWebsocket";

export function Standup({ standupState }: { standupState: RunningState }) {
  return (
    <div className="standup">
      <h1>Standup</h1>
      <div className="standup__activeContainer">
        <h2>You're up!</h2>
        {standupState.members[0]}
      </div>
      <pre>{JSON.stringify(standupState, null, 2)}</pre>
    </div>
  );
}
