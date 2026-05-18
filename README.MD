# StatusScout

Security and health monitoring for apps built with AI tools like Lovable, Bolt.new, v0, and Cursor — catch what the AI missed before your users do.

Run a free scan (no signup): [statusscout.dev](https://statusscout.dev)

## Why StatusScout?

AI-generated code ships with 2.74× more security vulnerabilities than human-written code (CodeRabbit, Dec 2025). Most indie developers and vibe coders have no idea their Lovable or Bolt app is exposing `.env` files, missing security headers, or vulnerable to subdomain takeover.

StatusScout catches this in seconds — and keeps watching so you don't have to.

## What It Checks

- **Security headers** — CSP, HSTS, X-Frame-Options, Referrer-Policy, and 6 more that AI scaffolding almost never sets
- **Exposed files** — `.env`, debug routes, admin panels, and backup paths that AI tools commonly scaffold without locking down
- **SSL / HTTPS** — certificate validity, expiry alerts, domain match
- **Uptime** — real-time monitoring with email, SMS, and ntfy alerts
- **DNS health** — SPF, DMARC, MX, and subdomain takeover detection via subfinder + subzy
- **Broken links** — crawls up to 4,000 URLs per run
- **SEO & Accessibility** — Lighthouse-powered basics
- **Core Web Vitals** — via Google PageSpeed Insights (requires API key)
- **Custom test flows** — Playwright-based signup, checkout, and journey automation

## Project Structure

```
packages/api/        # Fastify REST API server
packages/cron/       # Cron scheduler — triggers periodic checks
packages/frontend/   # React dashboard (post-login app)
packages/landing/    # Public marketing & scan page
packages/shared/     # Shared utilities (notifications, issue history)
packages/worker/     # Background worker — executes all checks
assets/              # Static assets (logo, wordlists)
```

## Getting Started

### Prerequisites

- Docker and docker-compose

### Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/vincenius/statusscout.git
   cd statusscout
   ```

2. Copy `.env.dist` to `.env` and fill in your secrets:
   ```sh
   cp .env.dist .env
   ```

3. Start all services:
   ```sh
   docker compose up -d
   ```

4. Open [http://localhost:3000](http://localhost:3000).

### Development

Requires Node.js v20+, local MongoDB + Redis instances, and the following tools for DNS and browser-based checks:

If you don't have MongoDB and Redis running locally, you can use the provided dev compose file to spin them up:
```sh
docker compose -f docker-compose.dev.yml up -d
```

**[subfinder](https://github.com/projectdiscovery/subfinder)** — subdomain discovery (used by DNS checks):
```sh
go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
```

**[subzy](https://github.com/LukaSikic/subzy)** — subdomain takeover detection (used by DNS checks):
```sh
go install github.com/PentestPad/subzy@latest
```

Make sure `$GOPATH/bin` (default: `~/go/bin`) is in your `$PATH`.

**Playwright Chromium** — headless browser (used by Lighthouse and custom flow checks):
```sh
npx playwright install chromium   # run after yarn install
```

DNS and Lighthouse checks will fail gracefully without these tools — the worker catches errors and continues. They are only required when working on those specific check modules.

```sh
yarn          # install all workspace dependencies
yarn dev      # start all packages in dev mode
```

Or run each package separately — see the `dev` script in each `package.json`.

## License

Source-available with restrictions on reselling as a hosted service. Free for personal and commercial self-hosted use.
