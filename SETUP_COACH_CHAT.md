# Setting up the in-app coach chat

The Prakriyā app's new "Coach" tab talks to Claude through a Netlify
Function (`netlify/functions/coach-chat.js`) that lives in this repo. The
function needs your own Anthropic API key to actually call Claude — that's
the one thing only you can provide (an AI session can't create an account or
hold a secret on your behalf). Takes about 5 minutes.

## 1. Create an Anthropic account and API key

1. Go to https://console.anthropic.com and sign in (or create an account).
2. Add a payment method under **Settings → Billing** — the API is pay-per-use,
   billed by tokens (roughly a fraction of a cent per chat message with the
   model this function uses). Check https://www.anthropic.com/pricing for
   current rates before relying on this document's numbers — pricing pages
   change over time and shouldn't be trusted from a document rather than
   the source.
3. Go to **Settings → API Keys → Create Key**. Copy the key — it's shown
   once (starts with `sk-ant-`).

## 2. Add the key to Netlify

1. Open this site in the Netlify dashboard → **Site configuration →
   Environment variables**.
2. Add a new variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: the `sk-ant-...` key from step 1
   - Scope: all deploy contexts (or at least Production)
3. Trigger a redeploy (Netlify picks up new env vars on the next deploy, not
   retroactively on the current one) — **Deploys → Trigger deploy → Deploy
   site**.

That's it — no other config needed. The function reads the key from
`process.env.ANTHROPIC_API_KEY` at request time; it's never written into any
file in this repo, so it stays out of git history and out of the app.

## 3. (Optional) Set a usage cap in your Anthropic account

Since the app-side daily message limit is a UX nudge, not a hard security
boundary (see the comment at the top of `coach-chat.js`), it's worth setting
a spend limit as your real backstop:

**console.anthropic.com → Settings → Billing → Usage limits** — set a
monthly cap you're comfortable with. If it's hit, the function will start
returning errors (the app shows "Couldn't reach the coach right now") until
the next billing period or until you raise the cap — it fails closed, not
by silently over-spending.

## 4. What the function actually does

- Receives the last ~16 turns of one user's coach conversation from the app.
- Enforces hard server-side limits (message count, per-message length, total
  conversation length) regardless of what the client sends, before calling
  Anthropic.
- Calls Claude with a fixed system prompt (the coach's persona) and a capped
  `max_tokens`, using a pinned model snapshot
  (`claude-haiku-4-5-20251001` — override with an `ANTHROPIC_MODEL` env var
  if you want to move to a newer snapshot without a code change).
- Returns just the reply text — nothing else about your Anthropic account or
  API key is ever exposed to the app.

It does **not** see the user's habits, mood, journal, or spending data from
the app — the coach is general-purpose by design, so nothing else in
`AppState` is ever sent along with a chat message.
