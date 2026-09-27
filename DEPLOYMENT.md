# ASSISTA CORP — Production Deployment

## Target architecture

```text
Spaceship domain
      |
      v
Cloudflare DNS / proxy / TLS / WAF
      |
Cloudflare Tunnel (no public origin port)
      |
AWS Lightsail Ubuntu
      |
Docker Compose
  +-- assista-corp (Node 22 + SQLite)
  +-- cloudflared
      |
Persistent Docker volume: assista-corp-data
```

## Recommended cost profile

Start with one Lightsail Linux instance. The $5 USD plan is 0.5 GB RAM / 2 vCPU / 20 GB SSD; the $7 plan is 1 GB RAM / 2 vCPU / 40 GB SSD. For the production site plus Docker and cloudflared, use the $7 plan if budget permits. AWS currently lists these as fixed-price Lightsail bundles and offers a one-month free trial for the $5 plan subject to its Free Tier terms.

Cloudflare Tunnel can expose the application without opening inbound 80/443 on the Lightsail instance. Keep SSH restricted to your administrative IPs.

## 1. AWS

1. Create an Ubuntu 24.04 Lightsail instance.
2. Choose the $7 / 1 GB bundle for the initial production deployment.
3. Attach a static IPv4 address.
4. Open SSH only for your administrative source IP. Do not expose port 3000.
5. Install Docker Engine and Docker Compose plugin.
6. Clone the repository to `/opt/assista-corp`.
7. Copy `.env.production.example` to `.env.production` and populate secrets.

## 2. Cloudflare

1. Add `assistacorp.com` to Cloudflare and change the nameservers at Spaceship to the nameservers Cloudflare provides.
2. Create a Cloudflare Tunnel.
3. Create a public hostname for `assistacorp.com` and point it to `http://assista:3000` from the Docker network.
4. Add `www.assistacorp.com` only if the website needs it; redirect it to the canonical hostname.
5. Enable proxying and HTTPS.
6. Keep the origin inaccessible from the public Internet except SSH from your admin IPs.
7. Enable the Cloudflare WAF managed rules available on the selected plan.

Cloudflare should terminate public TLS and the tunnel should carry traffic to the origin. If you later use a directly exposed HTTPS origin, use Full (strict) rather than Flexible.

## 3. Microsoft 365 / Outlook lead notifications

The application now supports Microsoft Graph app-only mail delivery.

Create an Entra ID app registration and grant only `Mail.Send` application permission, then grant admin consent. Configure:

```env
MS_GRAPH_TENANT_ID=...
MS_GRAPH_CLIENT_ID=...
MS_GRAPH_CLIENT_SECRET=...
MS_GRAPH_SENDER=hr@assistacorp.com
MS_GRAPH_RECIPIENT=sales@assistacorp.com
```

The sender mailbox must exist in Microsoft 365. The application uses OAuth client credentials and Microsoft Graph; it does not store an Outlook password.

## 4. Start production

```bash
cd /opt/assista-corp
cp .env.production.example .env.production
chmod 600 .env.production

# Populate the real values, then:
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 assista
```

## 5. First admin setup

Do not expose the admin page publicly until the initial admin account and MFA have been verified.

Verify:

- admin login works
- MFA enrollment works
- editor/sales RBAC behaves correctly
- `/api/admin/*` is denied without the required permission
- session cookies have `Secure` and `HttpOnly` in production
- Turnstile secret and expected hostname are configured

## 6. Backups

The SQLite database lives in the `assista-corp-data` Docker volume.

Create a local backup:

```bash
sudo mkdir -p /opt/assista/backups
sudo BACKUP_DIR=/opt/assista/backups /opt/assista-corp/scripts/backup-data.sh
```

Run it daily from cron/systemd. Keep at least 14 days locally. For business-critical lead data, also copy encrypted backups to a separate storage location such as S3 and test restoration monthly.

## 7. Go-live verification

```text
[ ] assistacorp.com resolves through Cloudflare
[ ] Cloudflare Tunnel is healthy
[ ] Origin has no public 3000 listener
[ ] SSH is restricted
[ ] NODE_ENV=production
[ ] TURNSTILE_SECRET_KEY configured
[ ] TURNSTILE_EXPECTED_HOSTNAME=assistacorp.com
[ ] Microsoft Graph Mail.Send configured and tested
[ ] Admin MFA enabled
[ ] Production .env is not in Git
[ ] SQLite backup completed
[ ] Backup restore tested
[ ] GitHub Security Audit is green
[ ] Public lead form tested
[ ] Admin RBAC tested
[ ] CSP/security headers verified
[ ] Cloudflare WAF enabled
[ ] Error logs reviewed
```
