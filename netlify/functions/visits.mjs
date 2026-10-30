// Visitor counter.
//   GET  /api/visits  -> { count }            (read the total)
//   POST /api/visits  -> { count }            (add one, then return the total)
// The browser only POSTs once per device (it remembers that in localStorage),
// so the number is "visitors", not page views. Only a single total is stored —
// no IP addresses, no cookies, no personal data.
import { getStore } from '@netlify/blobs';

export const config = { path: '/api/visits' };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export default async (req) => {
  try {
    const store = getStore('site-stats');
    let count = parseInt((await store.get('visitors')) || '0', 10) || 0;
    if (req.method === 'POST') {
      count += 1;
      await store.set('visitors', String(count));
    } else if (req.method !== 'GET') {
      return json({ error: 'method not allowed' }, 405);
    }
    return json({ count });
  } catch (err) {
    return json({ error: 'counter unavailable' }, 503);
  }
};
