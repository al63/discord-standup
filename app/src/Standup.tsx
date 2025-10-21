import type { StandupState } from "./App";

export function Standup({ standupState }: { standupState: StandupState }) {
  return (
    <div>
      <h1>Standup</h1>
      <pre>{JSON.stringify(standupState, null, 2)}</pre>
    </div>
  );
}
