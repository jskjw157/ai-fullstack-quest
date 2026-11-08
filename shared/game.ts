export const STAT_KEYS = ["frontend", "backend", "ai", "ops"] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export const ACTIVITY_TYPES = ["study", "quiz", "mission"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface StatMeta {
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}

export const STAT_META: Record<StatKey, StatMeta> = {
  frontend: {
    label: "프론트엔드",
    shortLabel: "FE",
    color: "#38bdf8",
    description: "화면, 상태, 사용자 경험",
  },
  backend: {
    label: "백엔드",
    shortLabel: "BE",
    color: "#a78bfa",
    description: "API, 데이터, 도메인 로직",
  },
  ai: {
    label: "AI",
    shortLabel: "AI",
    color: "#f472b6",
    description: "모델, 프롬프트, 에이전트",
  },
  ops: {
    label: "운영",
    shortLabel: "OPS",
    color: "#34d399",
    description: "배포, 관측, 자동화",
  },
};

export const ACTIVITY_META: Record<ActivityType, { label: string; hint: string }> = {
  study: { label: "학습", hint: "읽고, 듣고, 정리한 학습" },
  quiz: { label: "퀴즈", hint: "정답을 맞히면 더 큰 보상" },
  mission: { label: "미션", hint: "직접 만들고 검증한 코딩 작업" },
};

export const XP_PER_STAT_LEVEL = 100;
export const XP_PER_CHARACTER_LEVEL = 250;
export const MAX_TITLE_LENGTH = 80;
export const MAX_DIFFICULTY = 5;

export interface ActivityInput {
  type: ActivityType;
  stat: StatKey;
  title: string;
  correct?: boolean;
  difficulty?: number;
}

export interface StarterQuest {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  stat: StatKey;
  difficulty?: number;
}

export const STARTER_QUESTS: readonly StarterQuest[] = [
  {
    id: "fe-component",
    title: "React 컴포넌트 하나 만들기",
    description: "상태와 이벤트가 있는 컴포넌트를 만들고 화면에서 확인해요.",
    type: "mission",
    stat: "frontend",
    difficulty: 1,
  },
  {
    id: "be-endpoint",
    title: "API 엔드포인트 + 테스트",
    description: "입력 검증과 성공·실패 응답을 함께 설계해요.",
    type: "mission",
    stat: "backend",
    difficulty: 2,
  },
  {
    id: "ai-prompt",
    title: "프롬프트 실험 기록",
    description: "프롬프트를 바꾸고 결과 차이를 한 줄로 남겨요.",
    type: "study",
    stat: "ai",
  },
  {
    id: "ops-deploy",
    title: "배포·운영 자동화 점검",
    description: "로그, 헬스체크, 재시작 절차 중 하나를 개선해요.",
    type: "mission",
    stat: "ops",
    difficulty: 2,
  },
  {
    id: "quiz-http",
    title: "HTTP 상태 코드 퀴즈",
    description: "200, 201, 400, 401, 500의 쓰임을 구분해요.",
    type: "quiz",
    stat: "backend",
  },
  {
    id: "quiz-react",
    title: "React 렌더링 퀴즈",
    description: "state 변경이 렌더링을 일으키는 조건을 맞혀요.",
    type: "quiz",
    stat: "frontend",
  },
];

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  stat: StatKey;
  title: string;
  xp: number;
  day: string;
  createdAt: string;
}

export interface StatProgress {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
}

export interface CharacterProgress {
  name: string;
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  stats: Record<StatKey, StatProgress>;
}

export interface GameState {
  today: string;
  streak: number;
  character: CharacterProgress;
  activities: ActivityRecord[];
  quests: readonly StarterQuest[];
}

export function clampDifficulty(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 1;
  return Math.min(MAX_DIFFICULTY, Math.max(1, Math.round(value)));
}

export function rewardFor(input: ActivityInput): number {
  switch (input.type) {
    case "study":
      return 10;
    case "quiz":
      return input.correct === true ? 15 : 4;
    case "mission": {
      const difficulty = clampDifficulty(input.difficulty);
      return 20 + difficulty * 5;
    }
  }
}

export function levelFromXp(xp: number, perLevel = XP_PER_STAT_LEVEL): number {
  return 1 + Math.floor(Math.max(0, xp) / perLevel);
}

export function progressFor(xp: number, perLevel = XP_PER_STAT_LEVEL): StatProgress {
  const safeXp = Math.max(0, Math.floor(xp));
  return {
    xp: safeXp,
    level: levelFromXp(safeXp, perLevel),
    xpIntoLevel: safeXp % perLevel,
    xpToNextLevel: perLevel,
  };
}

function isActivityType(value: unknown): value is ActivityType {
  return typeof value === "string" && (ACTIVITY_TYPES as readonly string[]).includes(value);
}

function isStatKey(value: unknown): value is StatKey {
  return typeof value === "string" && (STAT_KEYS as readonly string[]).includes(value);
}

export type ParseResult =
  | { ok: true; value: ActivityInput }
  | { ok: false; error: string };

export function parseActivityInput(payload: unknown): ParseResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, error: "활동 기록은 JSON 객체여야 합니다." };
  }

  const body = payload as Record<string, unknown>;

  if (!isActivityType(body.type)) {
    return { ok: false, error: "type은 study, quiz, mission 중 하나여야 합니다." };
  }
  if (!isStatKey(body.stat)) {
    return { ok: false, error: "stat은 frontend, backend, ai, ops 중 하나여야 합니다." };
  }
  if (typeof body.title !== "string") {
    return { ok: false, error: "title은 문자열이어야 합니다." };
  }

  const title = body.title.trim();
  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
    return {
      ok: false,
      error: `title은 1자 이상 ${MAX_TITLE_LENGTH}자 이하여야 합니다.`,
    };
  }

  if (body.correct !== undefined && typeof body.correct !== "boolean") {
    return { ok: false, error: "correct는 boolean이어야 합니다." };
  }

  let difficulty = 1;
  if (body.difficulty !== undefined) {
    if (
      typeof body.difficulty !== "number" ||
      !Number.isInteger(body.difficulty) ||
      body.difficulty < 1 ||
      body.difficulty > MAX_DIFFICULTY
    ) {
      return { ok: false, error: `difficulty는 1~${MAX_DIFFICULTY} 사이의 정수여야 합니다.` };
    }
    difficulty = body.difficulty;
  }

  return {
    ok: true,
    value: {
      type: body.type,
      stat: body.stat,
      title,
      correct: body.type === "quiz" ? body.correct === true : undefined,
      difficulty: body.type === "mission" ? difficulty : undefined,
    },
  };
}

export function dayKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function previousDay(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function computeStreak(days: readonly string[], today: string): number {
  const uniqueDays = new Set(days);
  let cursor = uniqueDays.has(today) ? today : previousDay(today);
  if (!uniqueDays.has(cursor)) return 0;

  let streak = 0;
  while (uniqueDays.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}
