import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  ACTIVITY_META,
  ACTIVITY_TYPES,
  STAT_KEYS,
  STAT_META,
  rewardFor,
  type ActivityInput,
  type ActivityType,
  type GameState,
  type StarterQuest,
  type StatKey,
  type StatProgress,
} from "../shared/game.ts";
import { fetchState, recordActivity } from "./api.ts";

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function percent(into: number, next: number): number {
  if (next <= 0) return 0;
  return Math.min(100, Math.round((into / next) * 100));
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : timeFormatter.format(date);
}

function StatCard({
  statKey,
  progress,
}: {
  statKey: StatKey;
  progress: StatProgress;
}) {
  const meta = STAT_META[statKey];
  const width = percent(progress.xpIntoLevel, progress.xpToNextLevel);

  return (
    <article
      className="stat-card"
      style={{ "--stat-color": meta.color } as CSSProperties}
    >
      <div className="stat-head">
        <span className="stat-badge" aria-hidden="true">
          {meta.shortLabel}
        </span>
        <div className="stat-name">
          <h3>{meta.label}</h3>
          <p>{meta.description}</p>
        </div>
        <span className="stat-level">Lv.{progress.level}</span>
      </div>
      <div
        className="bar"
        role="progressbar"
        aria-label={`${meta.label} 경험치`}
        aria-valuemin={0}
        aria-valuemax={progress.xpToNextLevel}
        aria-valuenow={progress.xpIntoLevel}
      >
        <span style={{ width: `${width}%` }} />
      </div>
      <div className="stat-foot">
        <span>
          {progress.xpIntoLevel} / {progress.xpToNextLevel} XP
        </span>
        <span>누적 {progress.xp.toLocaleString("ko-KR")} XP</span>
      </div>
    </article>
  );
}

function QuestRow({
  quest,
  busy,
  onComplete,
}: {
  quest: StarterQuest;
  busy: string | null;
  onComplete: (quest: StarterQuest) => void;
}) {
  const statMeta = STAT_META[quest.stat];
  const xp = rewardFor({
    type: quest.type,
    stat: quest.stat,
    title: quest.title,
    correct: true,
    difficulty: quest.difficulty,
  });
  const key = `quest:${quest.id}`;

  return (
    <li className="quest" style={{ "--stat-color": statMeta.color } as CSSProperties}>
      <span className="quest-dot" aria-hidden="true" />
      <div className="quest-body">
        <div className="quest-tags">
          <span className="chip">{ACTIVITY_META[quest.type].label}</span>
          <span className="chip subtle">{statMeta.label}</span>
        </div>
        <h3>{quest.title}</h3>
        <p>{quest.description}</p>
      </div>
      <div className="quest-side">
        <span className="xp">+{xp} XP</span>
        <button
          type="button"
          className="ghost"
          disabled={busy !== null}
          onClick={() => onComplete(quest)}
        >
          {busy === key ? "기록 중…" : "완료"}
        </button>
      </div>
    </li>
  );
}

function ActivityList({ game }: { game: GameState }) {
  if (game.activities.length === 0) {
    return (
      <p className="empty">
        아직 기록이 없어요. 위에서 첫 퀘스트를 완료하거나 직접 기록을 남겨보세요.
      </p>
    );
  }

  return (
    <ol className="activity-list">
      {game.activities.map((activity) => (
        <li key={activity.id}>
          <span
            className="activity-dot"
            style={{ background: STAT_META[activity.stat].color }}
            aria-hidden="true"
          />
          <div>
            <strong>{activity.title}</strong>
            <p>
              {ACTIVITY_META[activity.type].label} ·{" "}
              {STAT_META[activity.stat].label} · {formatWhen(activity.createdAt)}
            </p>
          </div>
          <span className="xp">+{activity.xp} XP</span>
        </li>
      ))}
    </ol>
  );
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [type, setType] = useState<ActivityType>("study");
  const [stat, setStat] = useState<StatKey>("frontend");
  const [title, setTitle] = useState("");
  const [correct, setCorrect] = useState(true);
  const [difficulty, setDifficulty] = useState(2);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    fetchState(controller.signal)
      .then(setGame)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "상태를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [reloadKey]);

  async function log(input: ActivityInput, key: string): Promise<boolean> {
    setBusy(key);
    setError(null);
    try {
      setGame(await recordActivity(input));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "기록에 실패했습니다.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  function completeQuest(quest: StarterQuest): void {
    void log(
      {
        type: quest.type,
        stat: quest.stat,
        title: quest.title,
        correct: true,
        difficulty: quest.difficulty,
      },
      `quest:${quest.id}`,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fallbackTitle = `${ACTIVITY_META[type].label}: ${STAT_META[stat].label}`;
    const saved = await log(
      {
        type,
        stat,
        title: title.trim() || fallbackTitle,
        correct: type === "quiz" ? correct : undefined,
        difficulty: type === "mission" ? difficulty : undefined,
      },
      "form",
    );
    if (saved) setTitle("");
  }

  const previewXp = rewardFor({ type, stat, title: "preview", correct, difficulty });

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            AQ
          </span>
          <div>
            <p className="eyebrow">PERSONAL GROWTH RPG</p>
            <h1>AI Fullstack Quest</h1>
          </div>
        </div>
        <div className="top-status">
          {game ? (
            <>
              <span className={`streak ${game.streak > 0 ? "active" : ""}`}>
                🔥 {game.streak}일 연속
              </span>
              <span className="today">{game.today.replaceAll("-", ".")}</span>
            </>
          ) : (
            <span className="today">connecting…</span>
          )}
        </div>
      </header>

      {error ? (
        <div className="alert" role="alert">
          <span>{error}</span>
          {game === null ? (
            <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
              다시 시도
            </button>
          ) : (
            <button type="button" onClick={() => setError(null)}>
              닫기
            </button>
          )}
        </div>
      ) : null}

      {game === null ? (
        <section className="panel loading">
          <span className="spinner" aria-hidden="true" />
          <p>캐릭터 시트를 불러오는 중…</p>
        </section>
      ) : (
        <main className="layout">
          <aside className="character-panel panel">
            <div className="character-top">
              <div
                className="level-orb"
                style={
                  {
                    "--progress": `${percent(
                      game.character.xpIntoLevel,
                      game.character.xpToNextLevel,
                    )}%`,
                  } as CSSProperties
                }
              >
                <span>LV</span>
                <strong>{game.character.level}</strong>
              </div>
              <div>
                <p className="eyebrow">MY CHARACTER</p>
                <h2>{game.character.name}</h2>
                <p className="muted">
                  총 {game.character.totalXp.toLocaleString("ko-KR")} XP · 다음 레벨까지{" "}
                  {game.character.xpToNextLevel - game.character.xpIntoLevel} XP
                </p>
              </div>
            </div>

            <div
              className="bar character-bar"
              role="progressbar"
              aria-label="캐릭터 경험치"
              aria-valuemin={0}
              aria-valuemax={game.character.xpToNextLevel}
              aria-valuenow={game.character.xpIntoLevel}
            >
              <span
                style={{
                  width: `${percent(
                    game.character.xpIntoLevel,
                    game.character.xpToNextLevel,
                  )}%`,
                }}
              />
            </div>

            <div className="stats-grid">
              {STAT_KEYS.map((key) => (
                <StatCard key={key} statKey={key} progress={game.character.stats[key]} />
              ))}
            </div>
          </aside>

          <div className="content">
            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">TODAY</p>
                  <h2>오늘의 퀘스트</h2>
                </div>
                <span className="muted">완료 버튼을 누르면 바로 기록돼요</span>
              </div>
              <ul className="quest-list">
                {game.quests.map((quest) => (
                  <QuestRow
                    key={quest.id}
                    quest={quest}
                    busy={busy}
                    onComplete={completeQuest}
                  />
                ))}
              </ul>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">LOG</p>
                  <h2>직접 기록</h2>
                </div>
                <span className="muted">공부 · 퀴즈 · 미션 무엇이든</span>
              </div>

              <form className="log-form" onSubmit={(event) => void handleSubmit(event)}>
                <div className="form-grid">
                  <label>
                    활동 유형
                    <select
                      value={type}
                      onChange={(event) => setType(event.currentTarget.value as ActivityType)}
                    >
                      {ACTIVITY_TYPES.map((value) => (
                        <option key={value} value={value}>
                          {ACTIVITY_META[value].label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    능력치
                    <select
                      value={stat}
                      onChange={(event) => setStat(event.currentTarget.value as StatKey)}
                    >
                      {STAT_KEYS.map((value) => (
                        <option key={value} value={value}>
                          {STAT_META[value].label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="title-field">
                    무엇을 했나요?
                    <input
                      value={title}
                      maxLength={80}
                      placeholder="예: JWT 인증 미들웨어 구현하고 테스트 추가"
                      onChange={(event) => setTitle(event.currentTarget.value)}
                    />
                  </label>

                  {type === "quiz" ? (
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={correct}
                        onChange={(event) => setCorrect(event.currentTarget.checked)}
                      />
                      정답을 맞혔어요
                    </label>
                  ) : null}

                  {type === "mission" ? (
                    <label>
                      난이도
                      <select
                        value={difficulty}
                        onChange={(event) => setDifficulty(Number(event.currentTarget.value))}
                      >
                        {[1, 2, 3, 4, 5].map((level) => (
                          <option key={level} value={level}>
                            {level} / 5
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                <div className="form-foot">
                  <span className="reward-preview">예상 보상 +{previewXp} XP</span>
                  <button type="submit" className="primary" disabled={busy !== null}>
                    {busy === "form" ? "기록 중…" : "기록하기"}
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">HISTORY</p>
                  <h2>최근 활동</h2>
                </div>
                <span className="muted">{game.activities.length}개</span>
              </div>
              <ActivityList game={game} />
            </section>
          </div>
        </main>
      )}

      <footer className="footer">
        <span>Local-first · SQLite</span>
        <span>T3 Code + Amp workspace</span>
      </footer>
    </div>
  );
}
