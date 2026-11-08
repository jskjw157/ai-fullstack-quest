import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { QuestStore } from "../server/store.ts";

describe("QuestStore", () => {
  it("computes a multi-day streak from persisted activity days", () => {
    const db = new DatabaseSync(":memory:");
    const store = new QuestStore(db, "Asia/Seoul");

    store.record(
      { type: "study", stat: "frontend", title: "1일차" },
      new Date("2026-11-06T12:00:00.000Z"),
    );
    store.record(
      { type: "study", stat: "frontend", title: "2일차" },
      new Date("2026-11-07T12:00:00.000Z"),
    );
    store.record(
      { type: "study", stat: "frontend", title: "3일차" },
      new Date("2026-11-08T12:00:00.000Z"),
    );

    const state = store.snapshot(new Date("2026-11-08T13:00:00.000Z"));
    expect(state.streak).toBe(3);
    expect(state.today).toBe("2026-11-08");
    expect(state.character.stats.frontend.xp).toBe(30);
    expect(state.activities.map((activity) => activity.title)).toEqual([
      "3일차",
      "2일차",
      "1일차",
    ]);

    db.close();
  });

  it("accumulates XP across stats and levels the character", () => {
    const db = new DatabaseSync(":memory:");
    const store = new QuestStore(db, "Asia/Seoul");
    const now = new Date("2026-11-08T12:00:00.000Z");

    for (let index = 0; index < 10; index += 1) {
      store.record(
        {
          type: "mission",
          stat: "ops",
          title: `배포 미션 ${index + 1}`,
          difficulty: 5,
        },
        now,
      );
    }

    const state = store.snapshot(now);
    expect(state.character.stats.ops.xp).toBe(450);
    expect(state.character.stats.ops.level).toBe(5);
    expect(state.character.totalXp).toBe(450);
    expect(state.character.level).toBe(2);
    expect(state.character.xpIntoLevel).toBe(200);
    expect(state.character.xpToNextLevel).toBe(250);

    db.close();
  });
});
