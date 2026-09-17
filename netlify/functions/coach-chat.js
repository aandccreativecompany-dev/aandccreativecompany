// Thin proxy for the Prakriyā app's in-app mindset-coach chat.
//
// The Flutter app has nowhere safe to hold an Anthropic API key — anything
// shipped inside an APK can be extracted — so it never calls
// api.anthropic.com directly. It calls this Netlify Function instead, which
// holds the real key server-side (Site settings → Environment variables →
// ANTHROPIC_API_KEY) and forwards the request.
//
// Everything below the request-shape checks is a HARD server-side cap that
// applies no matter what the client sends. The app also enforces a daily
// message limit of its own (see kCoachDailyMessageLimit in the app's
// models.dart), but that's a client-side UX nudge, not a security boundary —
// a modified client could ignore it, so cost control has to live here too.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Dated snapshot per Anthropic's own guidance (docs.claude.com /
// about-claude/models/model-ids-and-versions): pin an exact model ID for
// production rather than an alias, so behavior never changes out from under
// this function on its own. Override via the ANTHROPIC_MODEL env var if you
// want to move to a newer snapshot without a code change.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

const MAX_TOKENS = 400;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;
const MAX_TOTAL_CHARS = 12000;

const SYSTEM_PROMPT = [
  'You are the in-app coach inside Prakriyā, a daily ritual and mindset app',
  'by A&C Creative Ventures. You help people build a grounded growth',
  'mindset — practical, warm, direct, never toxic-positive.',
  '',
  "You do NOT have access to the user's habit, mood, journal, or spending",
  "data from the app — every conversation starts with no memory of them.",
  "If someone references app data you don't have, ask them to tell you",
  'rather than guessing or assuming it.',
  '',
  'Keep replies concise — a few sentences, not an essay — and close with',
  'one concrete, doable next step when that fits naturally.',
  '',
  'If someone describes a mental health crisis, self-harm, or a medical',
  'concern, gently encourage them to reach out to a real person or',
  'professional rather than attempting to counsel that yourself.',
].join('\n');

function jsonResponse(statusCode, headers, data) {
  return {
    statusCode,
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(data),
  };
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, corsHeaders, { error: 'Method not allowed' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('coach-chat: ANTHROPIC_API_KEY is not set');
    return jsonResponse(500, corsHeaders, { error: 'Server not configured' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (_) {
    return jsonResponse(400, corsHeaders, { error: 'Invalid JSON body' });
  }

  const rawMessages = Array.isArray(payload.messages) ? payload.messages : null;
  if (!rawMessages || rawMessages.length === 0) {
    return jsonResponse(400, corsHeaders, { error: 'messages array is required' });
  }
  if (rawMessages.length > MAX_MESSAGES) {
    return jsonResponse(400, corsHeaders, { error: 'Too many messages in one request' });
  }

  const messages = [];
  let totalChars = 0;
  for (const m of rawMessages) {
    const role = m && (m.role === 'user' || m.role === 'assistant') ? m.role : null;
    const content = m && typeof m.content === 'string' ? m.content.trim() : '';
    if (!role || !content) {
      return jsonResponse(400, corsHeaders, { error: 'Malformed message in messages array' });
    }
    if (content.length > MAX_MESSAGE_CHARS) {
      return jsonResponse(400, corsHeaders, { error: 'A message exceeds the length limit' });
    }
    totalChars += content.length;
    messages.push({ role, content });
  }
  if (totalChars > MAX_TOTAL_CHARS) {
    return jsonResponse(400, corsHeaders, { error: 'Conversation exceeds the length limit' });
  }
  if (messages[messages.length - 1].role !== 'user') {
    return jsonResponse(400, corsHeaders, { error: 'Last message must be from the user' });
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('coach-chat: Anthropic API error', response.status, data);
      return jsonResponse(502, corsHeaders, { error: 'Upstream error' });
    }

    const reply = Array.isArray(data.content)
      ? data.content
          .filter((block) => block && block.type === 'text')
          .map((block) => block.text)
          .join('')
      : '';

    if (!reply.trim()) {
      return jsonResponse(502, corsHeaders, { error: 'Empty reply from model' });
    }

    return jsonResponse(200, corsHeaders, { reply: reply.trim() });
  } catch (err) {
    console.error('coach-chat: request failed', err);
    return jsonResponse(502, corsHeaders, { error: 'Request to Anthropic failed' });
  }
};
