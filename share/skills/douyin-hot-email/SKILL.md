---
name: douyin-hot-email
description: Fetch a timestamped Douyin hot-search Top 50 snapshot and email it to a user-specified recipient. Use when the user asks to send the Douyin hot list or hot-search rankings by email.
---

# Douyin Hot List Email

Send a truthful, timestamped Douyin hot-search Top 50 snapshot by email.

## Before sending

- Treat email delivery as an external write. Require the user to explicitly provide the recipient and authorize the sender account in the current request or prior active context.
- Prefer an available Email MCP for account discovery and sending. Follow that MCP's schema and verify delivery using its returned message ID or status when supported.
- If no Email MCP is available, use SMTP only after the user provides the SMTP host, port/TLS mode, sender address, and an app password or authorization method. Never ask for, show, log, or save an account login password or authorization code.
- Do not presume the sender and recipient are the same address merely because the user supplies one address.

## Fetch the ranking

1. Browse for a current public source that shows all 50 entries, including each title and heat value where available.
2. Capture the source URL and its stated update time. The email must identify this as a snapshot and show that update time in the user’s timezone.
3. If no current full Top 50 is available, do not label an older list as real-time. Either ask whether to send the latest complete snapshot, or, when the user has already asked for the list without requiring real-time data, send it with an explicit snapshot date and time.
4. Preserve ranks exactly as supplied. Do not merge, re-rank, or invent missing entries.

## Compose and deliver

- Use a concise subject such as `抖音热榜 Top 50｜YYYY-MM-DD 快照`.
- Begin the body with the snapshot time and source URL, then list ranks 1–50 as `排名. 话题（热度）`. Omit the heat value only when the source does not provide one.
- Include a short freshness note when the snapshot is older than the current day.
- Send one message unless the user requests recurring delivery or multiple recipients.
- Report success only after the sending provider has accepted the message or returned a successful delivery status. If delivery cannot be verified, say that it was submitted but unverified.

## Security and failure handling

- Keep credentials in the sending provider, OS credential store, or a user-designated local secret file; never copy them into the skill, workspace, output, or email body.
- Do not retry an SMTP send automatically after an ambiguous connection failure: it may have been accepted. First check provider-side status if available, then ask the user before any duplicate send.
- If a source exposes fewer than 50 entries, state the limit rather than padding the list.
