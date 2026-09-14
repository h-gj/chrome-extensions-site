---
name: cloudflare-manager
description: Manage Cloudflare DNS records, Tunnels (cloudflared), and Zero Trust policies. Use when pointing domains, exposing local services via tunnels, updating ingress rules, or when the user mentions Cloudflare DNS, cloudflared, or CLOUDFLARE_API_TOKEN.
---

# Cloudflare Manager

Standardized system for managing Cloudflare infrastructure and local tunnel ingress.

Skill root: `~/.cursor/skills/cloudflare-manager`

## Prerequisites
- **Binary**: `python` (or `python3`) and `cloudflared` must be installed.
- **Credentials**: `CLOUDFLARE_API_TOKEN` (minimal Zone permissions) and `CLOUDFLARE_ZONE_ID` in the environment or this skill's `.env`.

## Setup
1. Credentials live in this skill's `.env` (copied from WorkBuddy) or in the environment.
2. Install Python deps from the skill root:
   - Windows: `python -m venv .venv` then `.venv\Scripts\pip install -r requirements.txt`
   - Unix: `bash scripts/install.sh`

Load `.env` when running the CLI (the script does this automatically).

## Core Workflows

Run from any directory. Prefer the skill venv Python after setup.

- **List DNS**: `python ~/.cursor/skills/cloudflare-manager/scripts/cf_manager.py list-dns`
- **Add DNS**: `python ~/.cursor/skills/cloudflare-manager/scripts/cf_manager.py add-dns --type A --name <subdomain> --content <ip>`
- **Update ingress**: `python ~/.cursor/skills/cloudflare-manager/scripts/cf_manager.py update-ingress --hostname <host> --service <url>`
- **Safety**: Use `--dry-run` to preview configuration changes before application.

On Windows PowerShell, expand `~` as `$env:USERPROFILE`.

## Security & Permissions
- **Sudo Usage**: The `update-ingress` command requires `sudo` to write `/etc/cloudflared/config.yml` and restart the `cloudflared` service (Linux). That path does not apply to typical Windows installs.
- **Token Isolation**: Keep API tokens scoped narrowly to specific zones and permissions. Do not commit `.env`.

## Reference
- **Tunnel Logic**: See [references/tunnel-guide.md](references/tunnel-guide.md).
