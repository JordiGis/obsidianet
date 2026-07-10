# obsidianet

Self-hosted Obsidian server in Docker. Runs the full Obsidian desktop app in your
browser via [obsidian-remote](https://github.com/sytone/obsidian-remote) (KasmVNC),
so you can reach the same vault from **any device** — laptop, phone, tablet — with
just a browser and a **login**. No per-device install, no plugin setup.

## Why this approach

| Option | Access | Login | Per-device install |
|--------|--------|-------|--------------------|
| **obsidian-remote (this repo)** | Any browser | ✅ built-in | ❌ none |
| Obsidian LiveSync + CouchDB | Native app only | ✅ | ✅ app + plugin each device |

You picked "access from any device with login" → obsidian-remote fits best.

## Quick start

```bash
# 1. Configure
cp .env.example .env
#   edit .env -> set OBSIDIAN_USER and a strong OBSIDIAN_PASSWORD

# 2. Launch
docker compose up -d

# 3. Open
#   http://<host-ip>:8080     (or https://<host-ip>:8443)
#   log in with OBSIDIAN_USER / OBSIDIAN_PASSWORD
```

First launch: Obsidian opens in the browser. Create/open a vault under `/vaults`
(mapped to `./data/vaults` on the host).

## Data

| Container path | Host path | Contents |
|----------------|-----------|----------|
| `/vaults` | `./data/vaults` | Your notes (the vault) |
| `/config` | `./data/config` | Obsidian app config, plugins, layout |

Both are git-ignored. Back up `./data/` to keep your notes safe.

## Access from outside your network

The container only exposes HTTP/HTTPS on the host. To reach it from the internet,
**do not** port-forward it raw. Put it behind one of:

- A reverse proxy with TLS (Caddy / Traefik / nginx) + the built-in login.
- A VPN / [Tailscale](https://tailscale.com) — reach the host privately, no public exposure.

The built-in login is basic-auth over KasmVNC; always add TLS before exposing it.

## Commands

```bash
docker compose up -d        # start
docker compose logs -f      # watch logs
docker compose down         # stop
docker compose pull         # update image, then `up -d` again
```

## Notes

- `shm_size: 1gb` and `seccomp:unconfined` are needed for the in-container browser render.
- `PUID`/`PGID` should match the host user that owns `./data` (`id -u` / `id -g`).
- Change `TZ` in `.env` to your timezone.
