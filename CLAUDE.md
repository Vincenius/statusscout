# StatusScout — CLAUDE.md

Website monitoring & security scanning platform. Self-hosted, Node.js monorepo.

## Writing Style

When writing any user-facing content (copy, emails, UI text, docs, marketing), follow the guide in [writing-style-guide.md](writing-style-guide.md).

## Architecture

Yarn workspaces + Lerna. Five packages, each runs as its own Docker service:

```
packages/
  api/      Fastify REST backend (port 4000)
  worker/   BullMQ job processor — runs all checks
  cron/     Scheduler — triggers periodic check jobs
  frontend/ React + Vite dashboard (port 3000, nginx)
  shared/   Shared utilities (notifications, issue history, DNS info)
```

MongoDB (`status-check` database) + Redis (BullMQ queue named `checks`).

## Key Data Flow

1. **Cron** enqueues jobs → Redis queue (`checks`)
2. **Worker** picks up jobs → forks a child process per job → runs checks → saves results to MongoDB → triggers notifications
3. **API** serves user-facing CRUD; also enqueues jobs on manual check requests
4. **Frontend** polls API for check status/results

## Collections

| Collection | Purpose |
|-----------|---------|
| `users` | Accounts, subscription, notification channels |
| `websites` | Monitored sites per user; `index` field = URL segment |
| `checks` | Every check result: `check`, `result`, `jobId`, `websiteId`, `createdAt` (ISO string) |
| `flows` | Custom Playwright test flows per website |
| `quickchecks` | Free public check records (cleaned up after 7 days) |

**Important**: `checks.createdAt` is stored as an ISO **string** (not Date), so MongoDB date comparisons use `.toISOString()` values.

## Check Types

| Type | When | Runs |
|------|------|------|
| `quick` | Every 5 min | headers + ssl |
| `extended` | Every 6 hrs | + fuzz + dns + custom flows |
| `full` | Daily at 04:00 | + lighthouse + performance + broken links |
| `free` | On-demand (public) | Same as full but uses smaller fuzz list |

## API Routes (all prefixed `/v1`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/login` | none | Passport local strategy |
| POST | `/register` | none | Creates trial (7d) or pro (no Stripe key) |
| GET | `/confirm` | none | Email confirmation token → redirect |
| POST | `/forgot-password` | none | |
| POST | `/reset-password` | none | 1-hour token TTL |
| GET | `/logout` | none | |
| GET | `/authenticated` | session | |
| POST | `/website/` | session + plan | Max 5 websites per user |
| GET | `/website/` | session | With latest check per site |
| DELETE | `/website/` | session | Soft delete (`deleted: true`) |
| PUT | `/website/notification-channel` | session | daily/critical channel config |
| PUT | `/website/notifications` | session | Per-check priority |
| GET | `/website/uptime` | session | 30-day uptime stats |
| POST | `/check` | session + plan | Enqueue full check |
| GET | `/check` | session | Poll check status/results |
| POST | `/statuscheck` | session | Sync HTTP status only |
| POST | `/quickcheck` | none | Free public check (Turnstile CAPTCHA) |
| GET | `/quickcheck` | none | Poll quickcheck results |
| GET | `/history` | none | 41-entry history by websiteId ObjectId |
| GET/POST/PUT/DELETE | `/flows` | session | Custom Playwright flows |
| GET | `/user/` | session | |
| DELETE | `/user/` | session | Hard deletes all user data |
| POST | `/user/notification-channel` | session | Add email/sms/ntfy channel |
| DELETE | `/user/notification-channel` | session | |
| POST | `/user/verify-channel` | none | Email channel verification token |
| POST | `/user/verify-phone-number` | none | SMS OTP verification |
| PUT | `/user/password` | session | |
| POST | `/user/unsubscribe` | none | Unsubscribe from emails by user ID |
| POST | `/notification/` | x-api-key | Internal: send email/sms notification |
| POST | `/notification/trial` | x-api-key | Trial ending emails |
| POST | `/notification/feedback` | x-api-key | Feedback request emails |
| POST | `/checkout/session` | session | Create Stripe embedded checkout |
| POST | `/checkout/return` | none | Confirm payment → set plan to pro |
| POST | `/checkout/cancel` | session | Cancel or revert subscription |

**Auth middleware**: Global `preHandler` blocks all routes unless `config.auth === false`. Routes needing active plan additionally call `hasActivePlan` middleware.

## Worker Check Modules (`packages/worker/checks/`)

| File | Check key | What it does |
|------|-----------|-------------|
| `uptime.js` | `uptime` | HTTP GET, status code + response time. Always runs first; if fails, retries once after 5s. Other checks skipped if uptime fails. |
| `ssl.js` | `ssl` | Certificate validity via ssl-checker |
| `headers.js` | `headers` | 10 security headers (CSP, HSTS, X-Content-Type-Options, etc.) |
| `fuzz.js` | `fuzz` | Probes hidden paths from fuzz list; 404 probability scoring |
| `dns.js` | `dns` | NS, MX, AAAA, SPF, DMARC, DKIM, CAA, DS, DNSKEY, wildcard, subdomain takeover via subfinder+subzy |
| `lighthouse.js` | `seo` / `a11y` | Lighthouse audits (pass = score > 90) |
| `performance.js` | `performance` | Google PageSpeed Core Web Vitals |
| `links.js` | `links` | Crawl & detect broken links |
| `custom.js` | `custom` | User-defined Playwright DSL flows |

## Notification System

**Channels**: `email` (AWS SES), `sms` (Bird.com), `ntfy` (ntfy.sh direct POST).

**Priority levels per check**: `critical` | `daily` | `disabled`.

Notification flow:
- After each check run → `runNotifications()` in `worker/notification.js` compares last 2 results to detect new failures → sends critical alerts
- Daily cron at 05:00 → `runDailyNotification()` → aggregates issues from last 24h → sends daily digest

ntfy is sent directly from the worker to `https://ntfy.sh/<topic>`. Email and SMS go through the internal `/v1/notification` API (uses `x-api-key` auth).

## Subscription Logic

- **Trial**: 7 days, `subscription.expiresAt` set
- **Pro**: Stripe subscription, `expiresAt: null`
- **Self-hosted** (no `STRIPE_SECRET_KEY`): Users get `plan: 'pro'` immediately, no expiry

`isProUser()` in `packages/api/utils/user.js` — checks plan is `pro`/`trial` AND expiry not passed.

## Cron Schedule (`packages/cron/index.js`)

```
03:00 daily    cleanUp()          — delete quickchecks >7d, checks >1mo
04:00 daily    tryRun('full')
05:00 daily    runNotifications() — daily digests
10:00 daily    trial + feedback emails (if SEND_EMAILS=true)
Every 6hr :10  tryRun('extended')
Every 5min :20 tryRun('quick')
```

`cleanUp()` runs once immediately on startup too.

## Environment Variables

Critical ones (see `.env.dist` for full list):

```
MONGODB_URI          MongoDB connection string
REDIS_HOST/PORT      Redis for BullMQ
API_KEY              Shared secret for internal service-to-service calls
SESSION_SECRET       ≥32 chars; used by @fastify/secure-session
PASSWORD_HASH_SECRET Used with CryptoJS SHA256 for password hashing
APP_URL              Frontend URL (used in email links, CORS)
API_URL              API URL (used by cron/worker for internal calls)
STRIPE_SECRET_KEY    Optional; if absent, all users get free pro access
CONCURRENT_RUNS      Worker concurrency (default 2)
DISABLE_REGISTRATION If true, only allow first user to register as admin
```

## Shared Package (`packages/shared/`)

- `getIssueHistory(checks)` — computes issue lifecycle (created → resolved) from check arrays; excludes first-ever check results to avoid false positives
- `checkDefaultNotifications` — default priority map (uptime/ssl = critical; rest = daily)
- `getNotificationMessage(notification)` — formats human-readable notification text

## Key Patterns

**Website `index` field**: Numeric string (e.g. `"1"`, `"2"`), used as URL path segment in frontend (`/website/1/report`). Assigned as `(totalWebsiteCount + 1).toString()` including deleted websites — never reused.

**Job data flow**: Cron enqueues with `{ type, websiteId }`. Worker spawns a child process via `fork()`, passes job data as `JOB_DATA` env var. 5-minute timeout per job. `triggerName === 'api-triggered-job'` skips post-check notifications (manual triggers don't re-notify).

**Custom flows**: Stored as `steps` array with DSL types: `goto`, `click`, `fill`, `type`, `waitForSelector`, `waitForTimeout`, `url`, `expect`, `evaluate`. Executed via Playwright.

**Subdomain tracking**: `subfinder` discovers subdomains, `subzy` checks for takeover. Subdomains are stored on the `websites` document and merged with new discoveries each run (fallback if subfinder fails).

## Running Locally

```bash
yarn install          # install all workspaces
npx lerna run dev     # start all packages in dev mode
```

Or with Docker:
```bash
cp .env.dist .env     # fill in required vars
docker-compose up -d
```

## File Locations Quick Reference

| What | Where |
|------|-------|
| API entry | `packages/api/index.js` |
| API routes | `packages/api/v1/*.js` |
| Worker entry | `packages/worker/worker.js` |
| Job dispatcher | `packages/worker/job-runner.js` |
| Check orchestration | `packages/worker/index.js` |
| Check modules | `packages/worker/checks/*.js` |
| Cron jobs | `packages/cron/index.js` |
| DB connection | `packages/api/db.js`, `packages/worker/db.js`, `packages/cron/db.js` |
| Issue history logic | `packages/shared/utils/issues.js` |
| Notification routing | `packages/worker/utils/sendNotifications.js` |
| Email templates | `packages/api/utils/templates/*.js` |
