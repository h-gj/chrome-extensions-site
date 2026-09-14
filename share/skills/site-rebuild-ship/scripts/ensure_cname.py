#!/usr/bin/env python3
"""Idempotent Cloudflare CNAME for GitHub Pages.

Calls cloudflare-manager cf_manager.py (same .env). DNS-only by default.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
CF_ROOT = SKILL_ROOT.parent / "cloudflare-manager"
CF_SCRIPT = CF_ROOT / "scripts" / "cf_manager.py"
VENV_PY = CF_ROOT / ".venv" / "Scripts" / "python.exe"
if not VENV_PY.exists():
    VENV_PY = CF_ROOT / ".venv" / "bin" / "python"


def run_cf(args: list[str]) -> dict:
    py = str(VENV_PY if VENV_PY.exists() else sys.executable)
    proc = subprocess.run(
        [py, str(CF_SCRIPT), *args],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr or proc.stdout)
        sys.exit(proc.returncode or 1)
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError:
        sys.stderr.write(proc.stdout)
        sys.exit(1)


def fqdn_for(name: str, records: list[dict]) -> tuple[str, str]:
    """Return (zone_apex, full_name) from list-dns rows."""
    hosts = [r.get("name") or "" for r in records]
    apex = min((h for h in hosts if h.count(".") >= 1), key=len, default="")
    if not apex:
        sys.exit("FATAL: list-dns returned no names; cannot infer zone")
    full = name if name.endswith("." + apex) or name == apex else f"{name}.{apex}"
    return apex, full


def main() -> None:
    p = argparse.ArgumentParser(description="Ensure a DNS-only CNAME exists")
    p.add_argument("--name", required=True, help="subdomain label, e.g. json")
    p.add_argument("--content", required=True, help="CNAME target, e.g. h-gj.github.io")
    p.add_argument("--comment", default="")
    p.add_argument("--proxy", action="store_true", help="orange cloud (default is DNS only)")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    extra = ["--dry-run"] if args.dry_run else []

    listed = run_cf([*extra, "list-dns"] if args.dry_run else ["list-dns"])
    if not listed.get("success"):
        print(json.dumps(listed, indent=2))
        sys.exit(1)
    records = listed.get("result") or []
    apex, full = fqdn_for(args.name, records)
    hits = [r for r in records if r.get("name") == full]
    want_proxy = bool(args.proxy)

    def ok(payload: dict) -> None:
        print(json.dumps(payload, indent=2))
        if not payload.get("success") and payload.get("status") != "dry-run":
            sys.exit(1)

    if not hits:
        cmd = [
            *extra,
            "add-dns",
            "--type",
            "CNAME",
            "--name",
            args.name,
            "--content",
            args.content,
            "--comment",
            args.comment or f"GitHub Pages CNAME on {apex}",
        ]
        if not want_proxy:
            cmd.append("--no-proxy")
        ok(run_cf(cmd))
        return

    rec = hits[0]
    same = (
        rec.get("type") == "CNAME"
        and rec.get("content") == args.content
        and bool(rec.get("proxied")) == want_proxy
    )
    if same and len(hits) == 1:
        print(
            json.dumps(
                {
                    "success": True,
                    "skipped": True,
                    "message": "CNAME already matches",
                    "result": rec,
                },
                indent=2,
            )
        )
        return

    if rec.get("type") != "CNAME" or len(hits) > 1:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": "conflicting records on this name; delete extras first",
                    "result": hits,
                },
                indent=2,
            )
        )
        sys.exit(1)

    cmd = [
        *extra,
        "update-dns",
        "--id",
        rec["id"],
        "--type",
        "CNAME",
        "--name",
        args.name,
        "--content",
        args.content,
        "--comment",
        args.comment or rec.get("comment") or "",
    ]
    if not want_proxy:
        cmd.append("--no-proxy")
    ok(run_cf(cmd))


if __name__ == "__main__":
    main()
