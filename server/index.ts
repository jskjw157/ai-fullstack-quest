import { serve } from "@hono/node-server";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "./app.ts";
import { QuestStore } from "./store.ts";

const port = Number(process.env.PORT ?? 8788);
const hostname = process.env.HOST ?? "127.0.0.1";
const dbPath = resolve(process.env.QUEST_DB_PATH ?? "data/quest.db");
const timeZone = process.env.QUEST_TIMEZONE ?? "Asia/Seoul";

mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
const store = new QuestStore(db, timeZone);
const app = createApp(store, {
  staticRoot: process.env.NODE_ENV === "production" ? "dist" : undefined,
});

const server = serve(
  { fetch: app.fetch, port, hostname },
  (info) => {
    console.log(
      `AI Fullstack Quest API listening on http://${info.address}:${info.port}`,
    );
    console.log(`Database: ${dbPath}`);
    console.log(`Timezone: ${timeZone}`);
  },
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.log(`\nReceived ${signal}, shutting down.`);
    server.close();
    store.close();
    process.exit(0);
  });
}
