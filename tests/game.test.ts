import { describe, expect, it } from "vitest";
import {
  XP_PER_STAT_LEVEL,
  computeStreak,
  dayKey,
  levelFromXp,
  parseActivityInput,
  progressFor,
  rewardFor,
} from "../shared/game.ts";

describe("rewardFor", () => {
  it("awards a fixed amount for study", () => {
    expect(rewardFor({ type: "study", stat: "ai", title: "논문 읽기" })).toBe(10);
  });

  it("rewards correct quizzes more than wrong ones", () => {
    expect(rewardFor({ type: "quiz", stat: "backend", title: "HTTP", correct: true })).toBe(15);
    expect(rewardFor({ type: "quiz", stat: "backend", title: "HTTP", correct: false })).toBe(4);
  });

  it("scales missions by difficulty", () => {
    expect(rewardFor({ type: "mission", stat: "frontend", title: "UI", difficulty: 1 })).toBe(25);
    expect(rewardFor({ type: "mission", stat: "frontend", title: "UI", difficulty: 3 })).toBe(35);
    expect(rewardFor({ type: "mission", stat: "frontend", title: "UI", difficulty: 5 })).toBe(45);
  });
});

describe("levels", () => {
  it("starts at level 1 and levels up every 100 stat XP", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(XP_PER_STAT_LEVEL - 1)).toBe(1);
    expect(levelFromXp(XP_PER_STAT_LEVEL)).toBe(2);
    expect(levelFromXp(250)).toBe(3);
  });

  it("reports progress inside the current level", () => {
    expect(progressFor(135)).toEqual({
      xp: 135,
      level: 2,
      xpIntoLevel: 35,
      xpToNextLevel: 100,
    });
  });
});

describe("computeStreak", () => {
  const today = "2026-11-08";

  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-11-06", "2026-11-07", "2026-11-08"], today)).toBe(3);
  });

  it("keeps the streak alive when the last activity was yesterday", () => {
    expect(computeStreak(["2026-11-06", "2026-11-07"], today)).toBe(2);
  });

  it("drops to zero after a missed day", () => {
    expect(computeStreak(["2026-11-05", "2026-11-06"], today)).toBe(0);
  });

  it("counts a single activity today", () => {
    expect(computeStreak(["2026-11-08"], today)).toBe(1);
  });

  it("returns zero without activity", () => {
    expect(computeStreak([], today)).toBe(0);
  });
});

describe("dayKey", () => {
  it("uses the configured timezone across the UTC boundary", () => {
    expect(dayKey(new Date("2026-11-08T14:30:00.000Z"), "Asia/Seoul")).toBe("2026-11-08");
    expect(dayKey(new Date("2026-11-08T15:30:00.000Z"), "Asia/Seoul")).toBe("2026-11-09");
  });
});

describe("parseActivityInput", () => {
  it("normalizes a mission", () => {
    const result = parseActivityInput({
      type: "mission",
      stat: "backend",
      title: "  API 추가  ",
      difficulty: 4,
    });
    expect(result).toEqual({
      ok: true,
      value: {
        type: "mission",
        stat: "backend",
        title: "API 추가",
        correct: undefined,
        difficulty: 4,
      },
    });
  });

  it("defaults quiz correctness to false", () => {
    const result = parseActivityInput({
      type: "quiz",
      stat: "ai",
      title: "프롬프트 퀴즈",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.correct).toBe(false);
  });

  it.each([
    [{ type: "dance", stat: "ai", title: "x" }, "type"],
    [{ type: "study", stat: "design", title: "x" }, "stat"],
    [{ type: "study", stat: "ai", title: "   " }, "title"],
    [{ type: "study", stat: "ai", title: "x".repeat(81) }, "title"],
    [{ type: "quiz", stat: "ai", title: "x", correct: "yes" }, "correct"],
    [{ type: "mission", stat: "ai", title: "x", difficulty: 6 }, "difficulty"],
    [null, "JSON"],
  ])("rejects invalid payload %j", (payload, expected) => {
    const result = parseActivityInput(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(expected);
  });
});
