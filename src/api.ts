import type { ActivityInput, GameState } from "../shared/game.ts";

async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
    ) {
      return body.message;
    }
  } catch {
    // Fall through to the generic message.
  }
  return `요청이 실패했습니다 (HTTP ${response.status}).`;
}

export async function fetchState(signal?: AbortSignal): Promise<GameState> {
  const response = await fetch("/api/state", { signal });
  if (!response.ok) throw new Error(await errorMessage(response));
  return (await response.json()) as GameState;
}

export async function recordActivity(input: ActivityInput): Promise<GameState> {
  const response = await fetch("/api/activities", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return (await response.json()) as GameState;
}
