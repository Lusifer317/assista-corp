# ASSISTA CORP — Production Deployment

## Existing production architecture

Keep the currently deployed Oracle Cloud Infrastructure (OCI) environment. This application update does not require a new AWS account, AWS instance, new VM, or replacement hosting platform.

```text
Spaceship domain registration
        |
Cloudflare DNS / proxy / TLS / WAF (if already enabled)
        |
Existing Cloudflare Tunnel (if already enabled)
        |
Existing Oracle Cloud compute instance
        |
Docker Compose
  +-- assista-corp (Node 22 + SQLite)
  +-- cloudflared (only if already part of the current deployment)
        |
Persistent SQLite data volume
```

The diagram describes the existing deployment pattern; verify the actual OCI instance, Docker Compose project, volume name, and Cloudflare route before operating it. Do not create duplicate infrastructure to match this diagram.

## 1. Preserve the existing OCI environment

- Keep the current OCI compute instance, VCN, subnet, route tables, network security groups/security lists, and attached storage.
- Keep the existing Cloudflare Tunnel and DNS configuration if they are already serving the production hostname.
- Do not expose the Node application port directly to the public Internet. Keep origin access private and allow only the current tunnel path.
- Keep SSH restricted to approved administrator source addresses and use the existing OCI access method.
- Confirm adequate free disk space before updating the container or running SQLite maintenance.

No instance-size, network, or cloud-resource change is required by the application changes in this branch.

## 2. Domain and edge configuration

The domain is registered with Spaceship. If Cloudflare is already authoritative for DNS and terminates public TLS, preserve the current nameserver, DNS, WAF, and Tunnel configuration.

Before changing DNS or Tunnel routes, export or record the working configuration. Do not change nameservers or create a second Tunnel as part of this application update.

The origin should remain inaccessible from the public Internet except through the approved access path. If a directly exposed HTTPS origin is intentionally used, configure TLS correctly and do not use Flexible TLS.

## 3. Microsoft 365 / Outlook lead notifications

The application currently contains Microsoft Graph app-only mail delivery support. This integration is intentionally outside the scope of the current application work; do not change its application registration, permissions, credentials, sender mailbox, recipient mailbox, or mail-flow configuration as part of this update.

Existing configuration variables (where already used) remain in the deployment environment:

```env
MS_GRAPH_TENANT_ID=...
MS_GRAPH_CLIENT_ID=...
MS_GRAPH_CLIENT_SECRET=...
MS_GRAPH_SENDER=...
MS_GRAPH_RECIPIENT=...
```

Do not copy real values into Git, issue comments, or deployment documentation.

## 4. Deploy through the existing Compose project

Perform deployment only after the pull request has been reviewed and merged and after confirming the production backup and rollback procedure.

From the existing application directory on the OCI host:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 assista
```

Use the current production environment file and Docker volume. Do not replace the production database with the repository's development database, and do not run seed commands against production.

## 5. Database backups

The SQLite database is persisted in the Docker volume configured by the production Compose file.

Before an application update or any database maintenance:

```bash
sudo mkdir -p /opt/assista/backups
sudo BACKUP_DIR=/opt/assista/backups /opt/assista-corp/scripts/backup-data.sh
```

Verify that the backup file exists, has a non-zero size, and can be opened/restored in a separate test location. Keep at least 14 days of encrypted backups on a separate storage target where available. Do not assume a backup succeeded just because the script returned.

## 6. One-time legacy analytics privacy reset

The previous visitor tracker recorded anonymous page events before the visitor chose whether to allow analytics. The new tracker does not start until explicit opt-in, and a visitor can reopen Privacy Settings and withdraw consent later.

Because the old database did not record the time of consent, old events cannot be reliably separated into pre-consent and post-consent activity. Before re-enabling analytics on the upgraded production version, run the reset utility after taking and verifying a database backup.

First run the dry-run report:

```bash
node scripts/reset-legacy-analytics.js
```

Review the counts. The utility is non-destructive unless explicitly invoked with `--apply`. With approval to clear historical anonymous telemetry, run:

```bash
node scripts/reset-legacy-analytics.js --apply
```

This removes legacy visitor sessions and analytics events and clears their session links from lead records. It **does not delete leads, lead messages, CRM statuses, or internal notes**. New visitor analytics will start from consented sessions after deployment. Keep the verified pre-reset backup according to the company's retention policy.

## 7. Post-deployment verification

- Confirm the public site and all primary routes load through the existing hostname.
- Confirm the analytics consent banner is shown to a visitor with no saved choice.
- Confirm no session or event is created before acceptance.
- Accept analytics, navigate service and industry pages, and verify only consented events appear in the admin dashboard.
- Reopen Privacy Settings, choose Essential Only, and verify the corresponding session/events are deleted and no further tracking is recorded.
- Submit a test enquiry and confirm it is stored even when analytics consent is declined; it must not be behaviorally attributed to a visitor session.
- Verify CMS edits to homepage, Behind the Business content, services, industries, and SEO metadata are reflected on the public site.
- Verify editor/admin/sales role permissions in the admin console.
- Confirm lead search, stage filtering, Lost stage, lead notes, CSV export, and the audit trail.
- Confirm the existing mail notification flow has not been changed as part of this release; test it separately under its existing operational procedure.
- Review application logs, OCI resource metrics, free disk space, and backup status.

## 8. Rollback

If the new application version fails validation:

1. Revert to the last known-good application image or commit using the current Compose deployment process.
2. Do not restore an older database over a newer database unless the rollback procedure explicitly requires it and the data-loss implications are understood.
3. If the legacy analytics reset was run, restore its pre-reset backup only if there is an approved reason to restore that historical telemetry; otherwise leave the privacy reset in place.
4. Verify public access, lead submission, admin authentication, and database integrity before declaring rollback complete.
