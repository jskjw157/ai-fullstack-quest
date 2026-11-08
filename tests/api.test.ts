import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../server/app.ts";
import { QuestStore } from "../server/store.ts";
import type { GameState } from "../shared/game.ts";

const openStores: Array<{ db: DatabaseSync; store: QuestStore }> = [];

function setup() {
  const db = new DatabaseSync(":memory:");
  const store = new QuestStore(db, "Asia/Seoul");
  openStores.push({ db, store });
  return { app: createApp(store), store };
}

afterEach(() => {
  for (const { db } of openStores.splice(0)) db.close();
});

function postActivity(app: ReturnType<typeof setup>["app"], body: unknown) {
  return app.request("/api/activities", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API", () => {
  it("reports health", async () => {
    const { app } = setup();
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; service: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe("ai-fullstack-quest");
  });

  it("starts with an empty character", async () => {
    const { app } = setup();
    const response = await app.request("/api/state");
    expect(response.status).toBe(200);
    const state = (await response.json()) as GameState;

    expect(state.character.totalXp).toBe(0);
    expect(state.character.level).toBe(1);
    expect(state.character.stats.frontend.xp).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.activities).toEqual([]);
    expect(state.quests.length).toBeGreaterThan(0);
  });

  it("records a mission and returns the updated character", async () => {
    const { app } = setup();
    const response = await postActivity(app, {
      type: "mission",
      stat: "backend",
      title: "API 엔드포인트 추가",
      difficulty: 3,
    });

    expect(response.status).toBe(201);
    const state = (await response.json()) as GameState;
    expect(state.character.stats.backend.xp).toBe(35);
    expect(state.character.totalXp).toBe(35);
    expect(state.character.stats.backend.level).toBe(1);
    expect(state.streak).toBe(1);
    expect(state.activities).toHaveLength(1);
    expect(state.activities[0]?.title).toBe("API 엔드포인트 추가");

    const followUp = (await (await app.request("/api/state")).json()) as GameState;
    expect(followUp.character.stats.backend.xp).toBe(35);
  });

  it("awards quiz XP by correctness", async () => {
    const { app } = setup();
    const correct = (await (
      await postActivity(app, {
        type: "quiz",
        stat: "ai",
        title: "정답",
        correct: true,
      })
    ).json()) as GameState;
    const wrong = (await (
      await postActivity(app, {
        type: "quiz",
        stat: "ai",
        title: "오답",
        correct: false,
      })
    ).json()) as GameState;

    expect(correct.character.stats.ai.xp).toBe(15);
    expect(wrong.character.stats.ai.xp).toBe(19);
  });

  it("rejects invalid activity payloads", async () => {
    const { app } = setup();
    const response = await postActivity(app, {
      type: "mission",
      stat: "design",
      title: "잘못된 능력치",
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; message: string };
    expect(body.error).toBe("invalid_activity");
    expect(body.message).toContain("stat");
  });

  it("rejects malformed JSON", async () => {
    const { app } = setup();
    const response = await app.request("/api/activities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("invalid_json");
  });

  it("returns JSON 404 for unknown API paths", async () => {
    const { app } = setup();
    const response = await app.request("/api/nope");
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("not_found");
  });
});
