import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
  STAT_KEYS,
  STARTER_QUESTS,
  XP_PER_CHARACTER_LEVEL,
  computeStreak,
  dayKey,
  progressFor,
  rewardFor,
  type ActivityInput,
  type ActivityRecord,
  type ActivityType,
  type CharacterProgress,
  type GameState,
  type StatKey,
  type StatProgress,
} from "../shared/game.ts";

interface ActivityRow {
  id: string;
  type: string;
  stat: string;
  title: string;
  xp: number;
  day: string;
  created_at: string;
}

export class QuestStore {
  readonly #db: DatabaseSync;
  readonly #timeZone: string;
  readonly #characterName: string;

  constructor(db: DatabaseSync, timeZone: string, characterName = "새싹 풀스택") {
    this.#db = db;
    this.#timeZone = timeZone;
    this.#characterName = characterName;
    this.#migrate();
  }

  #migrate(): void {
    this.#db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('study', 'quiz', 'mission')),
        stat TEXT NOT NULL CHECK (stat IN ('frontend', 'backend', 'ai', 'ops')),
        title TEXT NOT NULL,
        xp INTEGER NOT NULL CHECK (xp > 0),
        day TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS activities_created_at
        ON activities (created_at DESC);
      CREATE INDEX IF NOT EXISTS activities_day
        ON activities (day);
    `);
  }

  record(input: ActivityInput, now = new Date()): ActivityRecord {
    const xp = rewardFor(input);
    const day = dayKey(now, this.#timeZone);
    const createdAt = now.toISOString();
    const activity: ActivityRecord = {
      id: randomUUID(),
      type: input.type,
      stat: input.stat,
      title: input.title,
      xp,
      day,
      createdAt,
    };

    this.#db
      .prepare(
        `INSERT INTO activities (id, type, stat, title, xp, day, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        activity.id,
        activity.type,
        activity.stat,
        activity.title,
        activity.xp,
        activity.day,
        activity.createdAt,
      );

    return activity;
  }

  snapshot(now = new Date()): GameState {
    const today = dayKey(now, this.#timeZone);
    const totals = this.#db
      .prepare("SELECT stat, SUM(xp) AS xp FROM activities GROUP BY stat")
      .all() as Array<{ stat: string; xp: number }>;

    const stats = Object.fromEntries(
      STAT_KEYS.map((key) => [key, progressFor(0)]),
    ) as Record<StatKey, StatProgress>;

    for (const row of totals) {
      if ((STAT_KEYS as readonly string[]).includes(row.stat)) {
        stats[row.stat as StatKey] = progressFor(Number(row.xp));
      }
    }

    const totalXp = Object.values(stats).reduce((sum, stat) => sum + stat.xp, 0);
    const characterProgress = progressFor(totalXp, XP_PER_CHARACTER_LEVEL);
    const character: CharacterProgress = {
      name: this.#characterName,
      totalXp,
      level: characterProgress.level,
      xpIntoLevel: characterProgress.xpIntoLevel,
      xpToNextLevel: characterProgress.xpToNextLevel,
      stats,
    };

    const rows = this.#db
      .prepare(
        `SELECT id, type, stat, title, xp, day, created_at
         FROM activities
         ORDER BY created_at DESC, id DESC
         LIMIT 20`,
      )
      .all() as unknown as ActivityRow[];

    const activities: ActivityRecord[] = rows.map((row) => ({
      id: row.id,
      type: row.type as ActivityType,
      stat: row.stat as StatKey,
      title: row.title,
      xp: Number(row.xp),
      day: row.day,
      createdAt: row.created_at,
    }));

    const dayRows = this.#db
      .prepare("SELECT DISTINCT day FROM activities")
      .all() as Array<{ day: string }>;

    return {
      today,
      streak: computeStreak(
        dayRows.map((row) => row.day),
        today,
      ),
      character,
      activities,
      quests: STARTER_QUESTS,
    };
  }

  close(): void {
    this.#db.close();
  }
}
