# Deploy obsidianet on a VPS

Goes from the local LAN setup to a public server with two HTTPS domains:

- `notes.example.com` → the notes app (users)
- `admin.example.com` → the admin panel

Caddy is the only public entry (auto Let's Encrypt TLS). Docmost, the admin app,
Postgres and Redis stay bound to `127.0.0.1` — never exposed.

---

## 0. What you need

- A VPS: Ubuntu 22.04/24.04, **2 GB RAM minimum** (4 GB comfortable), 20+ GB disk.
- A domain you control.
- SSH access to the VPS.

## 1. DNS

Create two **A records** pointing at the VPS public IP:

| Type | Name | Value |
|------|------|-------|
| A | `notes` | `<VPS_IP>` |
| A | `admin` | `<VPS_IP>` |

Wait until `dig +short notes.example.com` returns the VPS IP before step 5
(TLS issuance needs DNS to resolve).

## 2. Server prep (run on the VPS)

```bash
# as root or a sudo user
sudo apt update && sudo apt -y upgrade

# Docker + compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER        # log out/in after this

# Firewall: only SSH + HTTP + HTTPS
sudo apt -y install ufw
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

## 3. Get the code

```bash
git clone https://github.com/JordiGis/obsidianet.git
cd obsidianet
```

## 4. Configure `.env`

```bash
cp .env.prod.example .env
```

Edit `.env`: set `NOTES_DOMAIN`, `ADMIN_DOMAIN`, `ACME_EMAIL`, `APP_URL`,
`ADMIN_USER`. Generate the secrets:

```bash
# fills the empty secret values in .env
sed -i "s|^APP_SECRET=.*|APP_SECRET=$(openssl rand -hex 32)|" .env
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 16)|" .env
sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$(openssl rand -hex 12)|" .env
sed -i "s|^ADMIN_JWT_SECRET=.*|ADMIN_JWT_SECRET=$(openssl rand -hex 32)|" .env
grep -E '^(ADMIN_USER|ADMIN_PASSWORD)=' .env    # note these to log in
```

Keep `BIND_ADDR=127.0.0.1:` and `COOKIE_SECURE=true` (already in the template).

## 5. Launch

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose ps
docker compose logs -f caddy      # watch TLS certs get issued (ctrl-c to stop)
```

Caddy fetches certificates automatically. When logs show the sites served:

- Notes app → `https://notes.example.com`
- Admin panel → `https://admin.example.com`

## 6. First run

1. Open `https://notes.example.com` → create the Docmost **workspace + owner**
   (first account).
2. Open `https://admin.example.com` → log in with `ADMIN_USER` / `ADMIN_PASSWORD`.
3. Create the rest of your users from the admin panel (no self-signup).

## 7. Hardening (recommended)

- **Disable Docmost's own signup** so the notes app can't be self-registered —
  do it in Docmost workspace settings, or ask me to script it.
- **Protect the admin domain further.** It controls everything. Options:
  - Add HTTP basic auth in front of it — in the `Caddyfile`, inside the
    `{$ADMIN_DOMAIN}` block:
    ```
    basic_auth {
        admin <bcrypt-hash>   # generate: docker run caddy caddy hash-password --plaintext 'yourpass'
    }
    ```
    then `docker compose ... up -d` again.
  - Or only reach it over a VPN / [Tailscale](https://tailscale.com) and don't
    make an `admin` A record public at all.
- `fail2ban` for SSH, disable password SSH login (keys only).

## 8. Backups

```bash
# database (users, notes, metadata)
docker compose exec -T db pg_dump -U docmost docmost | gzip > docmost-$(date +%F).sql.gz
```

Uploaded files live in the `docmost_storage` Docker volume. Back it up:

```bash
docker run --rm -v obsidianet_docmost_storage:/v -v "$PWD":/out alpine \
  tar czf /out/storage-$(date +%F).tar.gz -C /v .
```

Automate with a cron entry (e.g. daily `pg_dump` to off-server storage).

## 9. Updates

```bash
cd obsidianet
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- Docmost image = `latest`; pin a version tag if you want reproducible updates.
- The admin app rebuilds from source on `--build`.

## 9b. Auto-deploy on push (GitHub Actions)

`.github/workflows/deploy.yml` redeploys automatically on every push to `main`
(and can be run manually from the Actions tab). It SSHes into the VPS and runs
`git reset --hard origin/main` + `docker compose ... up -d --build`.

**One-time setup:**

1. On the VPS, create a dedicated SSH key for CI and authorize it:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/ci_deploy -N ""
   cat ~/.ssh/ci_deploy.pub >> ~/.ssh/authorized_keys
   cat ~/.ssh/ci_deploy            # copy this PRIVATE key for the secret below
   ```
   Make sure this VPS user is in the `docker` group and the repo is already
   cloned at some path (e.g. `/home/deploy/obsidianet`) with `.env` present.

2. In the GitHub repo → **Settings → Secrets and variables → Actions**, add:

   | Secret | Value |
   |--------|-------|
   | `VPS_HOST` | VPS IP or hostname |
   | `VPS_USER` | SSH user (in the `docker` group) |
   | `VPS_SSH_KEY` | the **private** key printed above (`~/.ssh/ci_deploy`) |
   | `VPS_PATH` | repo path on the VPS, e.g. `/home/deploy/obsidianet` |
   | `VPS_PORT` | SSH port (optional, default `22`) |

3. Push to `main` → watch it deploy under the repo's **Actions** tab.

Notes:
- The repo is public, so the VPS pulls over HTTPS with no git credentials. For a
  private repo, add a GitHub **deploy key** on the VPS and use the SSH remote.
- `.env` on the VPS is untouched (git-ignored; `reset --hard` never deletes
  untracked files).
- To deploy from a different branch, change `branches: [main]` and the
  `origin/main` reset target in the workflow.

## 10. Troubleshooting

| Symptom | Check |
|---------|-------|
| TLS not issued | DNS resolves? ports 80/443 open? `docker compose logs caddy` |
| 502 on a domain | app container healthy? `docker compose ps`, `logs docmost` / `logs admin` |
| Admin login fails | `COOKIE_SECURE=true` requires HTTPS; use the `https://` URL |
| Out of memory | Docmost + Postgres need ~2 GB; add swap or resize VPS |

---

### One-liner recap

```bash
git clone https://github.com/JordiGis/obsidianet.git && cd obsidianet
cp .env.prod.example .env    # edit domains + generate secrets (step 4)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
