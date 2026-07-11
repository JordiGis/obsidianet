# obsidianet

Private, self-hosted **Notion-style notes app** ([Docmost](https://github.com/docmost/docmost))
with a **custom admin panel** on top. Two separate logins:

| # | App | URL | Who | Purpose |
|---|-----|-----|-----|---------|
| 1 | **Docmost** | `http://Mac-2.local:3000` | users | write notes (Notion-style) |
| 2 | **Admin panel** | `http://Mac-2.local:8888` | admin only | manage everything |

The admin panel is a Notion-styled dashboard (Next.js) that talks directly to
Docmost's Postgres + storage. From it the admin can:

- **Create / deactivate / delete users** — there is **no self-signup**; users are
  created only here. A created user can log straight into Docmost.
- **Browse documents** (all pages, by space/author).
- **Browse files & images** (thumbnails, size, type, which page).
- **See storage used** and **stats + charts** (users/month, storage by type,
  pages per space).

Everything runs in Docker.

## Services

| Service | Role |
|---------|------|
| `docmost` | The notes app — user login #1 (`DOCMOST_PORT`) |
| `admin` | Custom admin panel — admin login #2 (`ADMIN_PORT`) |
| `db` | Postgres (shared: Docmost data; admin reads it) |
| `redis` | Docmost cache |

The `admin` service mounts Docmost's storage volume **read-only** to preview
uploaded images.

## Setup

```bash
cp .env.example .env
#   fill secrets (see openssl hints). Set ADMIN_USER / ADMIN_PASSWORD.
docker compose up -d --build
```

- Users app: **http://Mac-2.local:3000** (or `http://localhost:3000` on this Mac)
- Admin panel: **http://Mac-2.local:8888** → log in with `ADMIN_USER` / `ADMIN_PASSWORD`

First run: open the notes app once to create the Docmost workspace/owner (if not
already done). Then create further users from the admin panel.

## How user creation works

The admin panel inserts a row into Docmost's `users` table (bcrypt password,
`email_verified_at` set) and adds the user to the workspace's default space
(`space_members`). No SMTP needed — the user logs into Docmost immediately with
the password you set.

> Note: this is a lightweight admin over Docmost's DB, not Docmost's paid admin
> features. Keep the admin panel port (`8888`) off the public internet.

## Admin panel dev (optional)

```bash
cd admin
npm install
DATABASE_URL=postgres://docmost:<DB_PASSWORD>@localhost:5432/docmost \
ADMIN_USER=admin ADMIN_PASSWORD=... ADMIN_JWT_SECRET=... npm run dev
```

## Commands

```bash
docker compose up -d --build     # start / rebuild admin
docker compose ps                # status
docker compose logs -f admin     # admin logs
docker compose logs -f docmost   # notes app logs
docker compose down              # stop (data persists in volumes)
```

## Data & backup

Named volumes: `docmost_storage` (uploads), `db_data` (Postgres), `redis_data`.

```bash
docker compose exec db pg_dump -U docmost docmost > backup.sql
```

## Access from outside your LAN / TLS

`Mac-2.local` is mDNS (LAN only, best on Apple devices). For remote/HTTPS, front
the two ports with a TLS reverse proxy (Caddy/Traefik) or a VPN /
[Tailscale](https://tailscale.com). Never expose the admin port publicly without TLS.
