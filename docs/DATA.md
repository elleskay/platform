# Database migrations and seed data

How an app's Postgres schema and data change on deploy. The deploy workflow looks for two scripts in the app's `db/` folder and runs them in order, before the new Lambda code goes live:

| Script | When it runs | What it does |
|---|---|---|
| `db/migrate.ts` | Every deploy, if the file exists | Drizzle migrate. Applies pending schema changes before the new Lambda goes live. |
| `db/seed-demo.ts` | Every deploy, if the file exists | Idempotent reference/demo data. **Must not delete user rows.** Looks up by natural key, inserts only if missing. |

Both are skipped silently if the file is absent, so non-DB apps incur no penalty.

A deploy that fails after migrating leaves the old code on the new schema, so keep migrations backward compatible. Never run destructive operations in a deploy (see [DEPLOY.md](DEPLOY.md) "Rollback").

## Two seed files

- `db/seed.ts` is the **dev/CI test fixture** seed. Wipes everything (`db.delete(...)`) and rebuilds a known clean state. Run by `npm run db:seed` locally and by the app's `test.yml` against the Postgres service container. **Never runs in prod.**
- `db/seed-demo.ts` is the **prod-safe** seed. Lives alongside `seed.ts`. Idempotent: every row is looked up by a natural key (`email` for users, `name + agency` for teams, `externalRef` for inventory, deterministic `submittedAt` for historical activity) before insert. Runs on every deploy.

Adding a prod row to `seed.ts` is DEPLOY.md gotcha #10: CI goes green, the deploy lands, and prod never gets the row.

## Idempotent seed pattern

```ts
// apps/web/db/seed-demo.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, eq } from "drizzle-orm";
import * as schema from "./schema";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  async function ensureTeam(name: string, agency: "FRS" | "ICA" | "hospital") {
    const existing = await db
      .select()
      .from(schema.teams)
      .where(and(eq(schema.teams.name, name), eq(schema.teams.agency, agency)))
      .limit(1);
    if (existing[0]) return existing[0];
    const [created] = await db.insert(schema.teams).values({ name, agency }).returning();
    return created;
  }

  const team1 = await ensureTeam("Central Fire Station", "FRS");
  // ...ensureUser, ensureTemplate, ensureInventoryItem follow the same pattern.

  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
```

## Real users vs a portfolio demo

How much `seed-demo.ts` seeds depends on who uses the deployed URL.

| Concern | App with real users | Portfolio demo (prod is the demo) |
|---|---|---|
| Goal | Empty workspace ready for real teams | Populated demo telling a story |
| `db/seed-demo.ts` scope | Reference data only (admin user, lookup tables) | Reference data + 30 days of synthetic activity (submissions, issues, audit, skips, varied inventory) |
| Synthetic activity | None | Deterministic, anchored to a stable `DEMO_ANCHOR` date so reruns are no-ops |
| Refreshing demo data | Never (demo stays empty) | Bump `DEMO_ANCHOR` in `seed-demo.ts`, push |
| Auth invite codes | Generated per real user onboarding | Pre-generated for reviewer self-onboard from any device |

A portfolio demo (e.g. armoury, scamshield) has **one** AWS environment and one CloudFront URL: no staging, no separate playground. Reviewers click around prod to evaluate the work, and there are no real users to protect from synthetic data. If you ever onboard real users, cut `seed-demo.ts` back to reference data before the first user signs up.

### Synthetic activity

Use the same `ensureX` helpers, then add a second block for synthetic historical activity:

```ts
// Anchored to a stable date so reruns produce identical rows
const DEMO_ANCHOR = new Date("2026-05-29T07:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

async function seedSyntheticActivity(db: ...) {
  // Pre-fetch existing rows in the synthetic window to skip duplicates
  const existing = await db
    .select({ templateId: submissions.templateId, submittedAt: submissions.submittedAt })
    .from(submissions)
    .where(gte(submissions.submittedAt, new Date(DEMO_ANCHOR.getTime() - 30 * DAY_MS)));
  const haveSub = new Set(existing.map((s) => `${s.templateId}|${s.submittedAt.toISOString()}`));

  for (let dayIdx = 1; dayIdx <= 30; dayIdx++) {
    const dayBase = new Date(DEMO_ANCHOR.getTime() - dayIdx * DAY_MS);
    dayBase.setUTCHours(7, 0, 0, 0);

    for (let tplIdx = 0; tplIdx < allTemplates.length; tplIdx++) {
      // ~70% inclusion rate, deterministic by (day, template) pair
      if (((dayIdx * 13 + tplIdx * 7) % 10) >= 7) continue;
      const submittedAt = new Date(dayBase.getTime() + tplIdx * 30 * 60 * 1000);
      const key = `${allTemplates[tplIdx].id}|${submittedAt.toISOString()}`;
      if (haveSub.has(key)) continue;
      // ...insert submission + responses + maybe an issue
    }
  }
}
```

Key points:

1. **`DEMO_ANCHOR` is a constant in source**, not `new Date()`. Without an anchor, every deploy produces new "today" rows and the seed stops being idempotent. Bump it when you want to refresh the demo window; otherwise the data ages in place, which is fine.
2. **Inclusion and failure rates are hashed from `(dayIdx, templateIdx)`**, not random. Reproducible across machines and reruns.
3. **Existence check before insert** uses the deterministic natural key (template + submittedAt). Same row, same lookup, every time.

### How rich is "rich enough"

Aim for the dashboard chart to have shape, not for a synthetic LinkedIn feed. Empirically for the armoury demo:

| Volume | Why |
|---|---|
| ~80 submissions over 30 days | Per-template avg scores render; chart has green/orange split visible |
| 3-5 open issues across severities, 6-8 resolved | Severity ladder visible, resolution flow has examples |
| 10 audit log entries | Audit log page is non-empty; covers template/invite/inventory action types |
| 3 skipped checks | Skip/unskip feature has historical evidence |
| 6-10 inventory items, 2 low-stock, 2 expiring within 7 days | Pulse stat cards non-zero, expiring-soon icon triggers |

Don't pad beyond this. Synthetic data that's too perfect is more suspicious to a reviewer than minimal data.

### Anti-patterns

- **Don't seed by date relative to "now".** `new Date(Date.now() - 5 * DAY_MS)` is not idempotent. Use `DEMO_ANCHOR + offset`.
- **Don't seed user-generated tables like real audit log entries via the real server actions.** Insert directly via `db.insert(...)`. Going through the action would write entries with `createdAt = now`, breaking idempotency.
- **Don't put demo data in `db/seed.ts`.** That file is destructive (`db.delete(...)`) and runs in CI test fixtures. Synthetic activity belongs in `db/seed-demo.ts` only.
- **Don't auto-reset the demo on a schedule.** If the reviewer's session is destroyed mid-evaluation, that's a worse outcome than slightly stale data.

### Verification

After deploy, **always** click around live prod with the structural-vs-behavioural distinction (`docs/TESTING.md` "Failure modes the gate does NOT catch") in mind. Spec coverage is not journey coverage. A 5-minute Playwright walk against the deployed URL catches the class of bug the gate does not.
