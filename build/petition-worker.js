/**
 * aircraft.fyi — Bring Back Concorde counter
 * Cloudflare Worker + KV. Makes the petition tally REAL and public.
 *
 * Deploy (about 10 minutes, free tier):
 *   1. Cloudflare dashboard -> Workers & Pages -> Create Worker, paste this file.
 *   2. Settings -> Variables -> KV Namespace Bindings: bind a new namespace as  PETITION
 *   3. Deploy. Copy the worker URL, e.g. https://concorde.<you>.workers.dev
 *   4. In build.js, in the petition page script, set:   var ENDPOINT = 'https://concorde.<you>.workers.dev';
 *   5. Rebuild. The tally goes public. Nothing else changes.
 *
 * Endpoints:  GET /count -> {count}     POST /sign {name,hash,t} -> {count,ok}
 * Dedupe is by signature hash, so one browser cannot inflate the count by resending.
 */
export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': 'https://aircraft.fyi',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);

    if (url.pathname === '/count') {
      const count = parseInt((await env.PETITION.get('count')) || '0', 10);
      return new Response(JSON.stringify({ count }), { headers: cors });
    }

    if (url.pathname === '/sign' && req.method === 'POST') {
      const body = await req.json().catch(() => null);
      if (!body || !body.hash || !body.name || String(body.name).trim().length < 2) {
        return new Response(JSON.stringify({ ok: false, error: 'bad request' }), { status: 400, headers: cors });
      }
      const key = 'sig:' + body.hash;
      if (await env.PETITION.get(key)) {                       // already counted
        const count = parseInt((await env.PETITION.get('count')) || '0', 10);
        return new Response(JSON.stringify({ ok: true, count, duplicate: true }), { headers: cors });
      }
      await env.PETITION.put(key, JSON.stringify({
        name: String(body.name).slice(0, 40), t: body.t || new Date().toISOString()
      }));
      const count = parseInt((await env.PETITION.get('count')) || '0', 10) + 1;
      await env.PETITION.put('count', String(count));
      return new Response(JSON.stringify({ ok: true, count }), { headers: cors });
    }

    return new Response(JSON.stringify({ ok: false }), { status: 404, headers: cors });
  }
};
