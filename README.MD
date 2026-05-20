# StatusScout

[![GitHub Stars](https://img.shields.io/github/stars/vincenius/statusscout?style=flat-square&logo=github)](https://github.com/vincenius/statusscout)
[![Last Commit](https://img.shields.io/github/last-commit/vincenius/statusscout?style=flat-square)](https://github.com/vincenius/statusscout/commits/master)
[![License](https://img.shields.io/badge/license-StatusScout%20License%202.0-blue?style=flat-square)](LICENSE.MD)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?style=flat-square&logo=docker)](docker-compose.yml)

![StatusScout — security and uptime monitoring](https://raw.githubusercontent.com/vincenius/statusscout/master/packages/landing/public/og.png)

StatusScout monitors security headers, SSL certificates, DNS records, exposed files, and more. You get an alert the moment something goes wrong. Self-hosted, open source, free to run.

Run a free scan (no signup): [statusscout.dev](https://statusscout.dev)

## What It Checks

- Security headers 
- SSL/TLS certificate validity
- Exposed sensitive files & hidden paths
- DNS health
- Cookie security
- Mixed content
- Page security
- Exposed API docs
- Broken links

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

Requires Node.js v20+, local MongoDB and Redis instances, and the following tools for DNS and browser-based checks.

If you don't have MongoDB and Redis running locally, spin them up with the dev compose file:
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

**Playwright Chromium** — headless browser (used by custom flow checks):
```sh
npx playwright install chromium   # run after yarn install
```

DNS and custom flow checks will fail gracefully without these tools. They are only needed when working on those specific check modules.

**Run the dev server**

```sh
yarn          # install all workspace dependencies
yarn dev      # start all packages in dev mode
```

Or run each package separately. See the `dev` script in each `package.json`.

## License

Source-available with restrictions on reselling as a hosted service. Free for personal and commercial self-hosted use. See [LICENSE.MD](LICENSE.MD).
