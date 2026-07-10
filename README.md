# obsidianet

Self-hosted, **Notion-style notes app** in Docker, powered by
[Docmost](https://github.com/docmost/docmost). Open it in any browser — laptop,
phone, tablet — log in, and edit. Sidebar with nested pages, block editor with a
slash `/` menu, emoji icons, real-time editing. No app install per device.

## Stack

- **docmost** — the app (NestJS + React, Tiptap block editor)
- **db** — PostgreSQL 16
- **redis** — cache / websockets

All in `docker-compose.yml`. Data persists in named volumes.

## Setup

```bash
cp .env.example .env
#   set APP_SECRET   -> openssl rand -hex 32
#   set DB_PASSWORD  -> openssl rand -hex 16
#   APP_URL          -> how clients reach it, e.g. http://Mac-2.local:3000

docker compose up -d
```

Open **http://localhost:3000** (this machine) or **http://Mac-2.local:3000**
(any device on the LAN). First visit shows a **setup page** — create your admin
account + workspace there. Auth is built in.

`.env` is git-ignored (holds `APP_SECRET` + DB password).

## Commands

```bash
docker compose up -d        # start
docker compose ps           # status
docker compose logs -f      # logs
docker compose down         # stop (data persists in volumes)
docker compose pull && docker compose up -d   # update
```

## Data & backup

Docker named volumes: `docmost_storage` (uploads), `db_data` (Postgres),
`redis_data`. Back up with `pg_dump`:

```bash
docker compose exec db pg_dump -U docmost docmost > backup.sql
```

## Access from outside your LAN

Do **not** port-forward raw. Put it behind TLS (Caddy/Traefik) or a VPN /
[Tailscale](https://tailscale.com). If you expose a public domain, set `APP_URL`
to `https://your-domain` and terminate TLS at the proxy.
