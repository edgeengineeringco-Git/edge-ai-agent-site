import http from 'node:http';

const TOKEN = process.env.TEAM_TELEGRAM_BOT_TOKEN;
const ALLOWED_ID = '262358925';
const PORT = Number(process.env.PORT || 8090);
const UPSTREAM = process.env.POPEBOT_URL || 'https://pbot.edgeengineers.net';

if (!TOKEN) throw new Error('TEAM_TELEGRAM_BOT_TOKEN is required');
const tg = (method, body = {}) => fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
  method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)
}).then(r => r.json());

async function reply(chatId, text) { await tg('sendMessage', { chat_id: chatId, text }); }
async function handle(update) {
  const msg = update.message;
  if (!msg?.chat?.id) return;
  const id = String(msg.from?.id || msg.chat.id);
  if (id !== ALLOWED_ID) { await reply(msg.chat.id, 'This team bot is restricted.'); return; }
  const text = (msg.text || '').trim();
  if (text === '/start' || text === '/help') {
    await reply(msg.chat.id, 'EDGE team access is active. Send a request and it will be forwarded to PopeBot.\n\nCommands: /help, /status'); return;
  }
  if (text === '/status') { await reply(msg.chat.id, 'Team gateway is online.'); return; }
  if (!text) { await reply(msg.chat.id, 'Please send a text request.'); return; }
  await reply(msg.chat.id, 'Request received. The team gateway is configured, but forwarding requires a dedicated PopeBot member API endpoint; your request was not sent using an administrator account.');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify({ok:true, bot:'team'})); }
  if (req.method !== 'POST' || req.url !== '/telegram/webhook') { res.writeHead(404); return res.end('Not found'); }
  let data=''; for await (const chunk of req) data += chunk;
  try { await handle(JSON.parse(data)); res.writeHead(200); res.end('ok'); } catch (e) { console.error(e); res.writeHead(500); res.end('error'); }
});
server.listen(PORT, () => console.log(`team gateway listening on ${PORT}`));
