# Free deployment (Render)

1. Push this repository to GitHub (the token is not in Git).
2. Create a free Web Service at https://render.com and connect the repository.
3. Set root directory to the repository root and use `render.yaml`, or select Docker with:
   - Dockerfile: `telegram-team-gateway/Dockerfile`
   - Docker context: repository root
4. Add the secret environment variable `TEAM_TELEGRAM_BOT_TOKEN` in Render. Paste the second bot token there.
5. Deploy and copy the service URL, e.g. `https://edge-team-telegram-gateway.onrender.com`.
6. Set the webhook (replace values locally; never commit the token):

```bash
curl -X POST "https://api.telegram.org/bot$TEAM_TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://YOUR-RENDER-URL.onrender.com/telegram/webhook"
```

7. Have Mahdi message `@EDGE_Team_Pope_Bot` with `/start`.

Render free services may sleep after inactivity. Telegram will wake the service on webhook delivery, but the first response can be delayed. The gateway currently provides restricted bot access only; it does not impersonate an admin or bypass PopeBot authentication.
