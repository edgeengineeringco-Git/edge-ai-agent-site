# EDGE Team Telegram Gateway

Restricted gateway for the team bot `@EDGE_Team_Pope_Bot`.

- Only Telegram ID `262358925` is accepted.
- The bot token is read from `TEAM_TELEGRAM_BOT_TOKEN`; never commit it.
- `/start`, `/help`, and `/status` are available.
- Requests are deliberately not forwarded through an admin account. Full PopeBot member forwarding requires a supported member/API endpoint.

## Run

```bash
TEAM_TELEGRAM_BOT_TOKEN=... npm start
```

Set the Telegram webhook to `https://YOUR-HOST/telegram/webhook` after deployment. This service must run on a public HTTPS host; GitHub Pages alone cannot run it.
