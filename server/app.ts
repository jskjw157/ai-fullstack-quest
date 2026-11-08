import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { STARTER_QUESTS, parseActivityInput } from "../shared/game.ts";
import type { QuestStore } from "./store.ts";

export interface AppOptions {
  staticRoot?: string;
}

export function createApp(store: QuestStore, options: AppOptions = {}) {
  const app = new Hono();

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      service: "ai-fullstack-quest",
      time: new Date().toISOString(),
    }),
  );

  app.get("/api/state", (c) => c.json(store.snapshot()));

  app.get("/api/quests", (c) => c.json({ quests: STARTER_QUESTS }));

  app.post("/api/activities", async (c) => {
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      return c.json(
        { error: "invalid_json", message: "JSON 본문을 읽을 수 없습니다." },
        400,
      );
    }

    const parsed = parseActivityInput(payload);
    if (!parsed.ok) {
      return c.json({ error: "invalid_activity", message: parsed.error }, 400);
    }

    store.record(parsed.value);
    return c.json(store.snapshot(), 201);
  });

  app.all("/api/*", (c) =>
    c.json({ error: "not_found", message: "API 경로를 찾을 수 없습니다." }, 404),
  );

  if (options.staticRoot) {
    app.use("*", serveStatic({ root: options.staticRoot }));
    app.get("*", serveStatic({ path: `${options.staticRoot}/index.html` }));
  }

  app.notFound((c) =>
    c.json({ error: "not_found", message: "경로를 찾을 수 없습니다." }, 404),
  );

  app.onError((error, c) => {
    console.error("Unhandled request error", error);
    return c.json(
      {
        error: "internal_error",
        message: "서버에서 요청을 처리하지 못했습니다.",
      },
      500,
    );
  });

  return app;
}
