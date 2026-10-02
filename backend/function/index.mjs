const DATABASE_URL = process.env.DATABASE_URL;
const ALLOWED_ORIGINS = new Set(['https://kenzuko.github.io']);

function corsHeaders(request) {
  const origin = request.headers.get('origin');
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'vary': 'Origin',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['access-control-allow-origin'] = origin;
    headers['access-control-allow-methods'] = 'GET,POST,OPTIONS';
    headers['access-control-allow-headers'] = 'Content-Type';
    headers['access-control-max-age'] = '600';
  }
  return headers;
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

function allowedOrigin(request) {
  const origin = request.headers.get('origin');
  return !!origin && ALLOWED_ORIGINS.has(origin);
}

function clean(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

function parseJsonCell(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return value; }
}

async function sql(query, params = []) {
  if (!DATABASE_URL) throw new Error('database_not_configured');
  const parsed = new URL(DATABASE_URL);
  const response = await fetch(`https://${parsed.hostname}/sql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Neon-Connection-String': DATABASE_URL,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'true',
    },
    body: JSON.stringify({ query, params }),
  });

  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok) {
    const error = new Error('database_query_failed');
    error.status = response.status;
    throw error;
  }
  return payload;
}

function firstCell(payload) {
  const row = payload?.rows?.[0];
  if (!row) return null;
  return Array.isArray(row) ? (row[0] ?? null) : (Object.values(row)[0] ?? null);
}

async function health(request) {
  try {
    const payload = await sql('SELECT current_database()::text, current_user::text');
    const row = payload?.rows?.[0] || [];
    return json(request, {
      ok: true,
      service: 'jotrip-sea-api',
      version: '1.0.0',
      database: Array.isArray(row) ? row[0] : undefined,
    });
  } catch {
    return json(request, { ok: false, service: 'jotrip-sea-api' }, 503);
  }
}

async function createRequest(request) {
  if (!allowedOrigin(request)) return json(request, { ok: false, error: 'origin_not_allowed' }, 403);
  const length = Number(request.headers.get('content-length') || '0');
  if (length > 32768) return json(request, { ok: false, error: 'payload_too_large' }, 413);

  let body;
  try { body = await request.json(); }
  catch { return json(request, { ok: false, error: 'invalid_json' }, 400); }

  const service = clean(body.service);
  const tripDate = clean(body.trip_date ?? body.date);
  const pax = Number(body.pax);
  const customerName = clean(body.customer_name ?? body.name);
  const hotelArea = clean(body.hotel_area ?? body.area ?? body.hotel);
  const options = body.options && typeof body.options === 'object' && !Array.isArray(body.options) ? body.options : {};
  const customerContact = clean(body.customer_contact ?? body.contact ?? body.phone);
  const customerNotes = clean(body.customer_notes ?? body.notes ?? body.note);
  const idempotencyKey = clean(body.idempotency_key);

  if (!service || !tripDate || !Number.isFinite(pax) || !customerName) {
    return json(request, { ok: false, error: 'missing_required_fields' }, 400);
  }

  try {
    const payload = await sql(
      `SELECT sea_api.create_request(
        $1::text,$2::date,$3::integer,$4::text,$5::text,$6::jsonb,$7::text,$8::text,$9::text
      )::text AS result`,
      [service, tripDate, String(Math.trunc(pax)), customerName, hotelArea, JSON.stringify(options), customerContact, customerNotes, idempotencyKey]
    );
    const result = parseJsonCell(firstCell(payload));
    return json(request, { ok: true, ...result }, result?.created === false ? 200 : 201);
  } catch (error) {
    console.error('create_request_failed', error?.message || 'unknown');
    return json(request, { ok: false, error: 'request_create_failed' }, 400);
  }
}

async function trackRequest(request, token) {
  if (!allowedOrigin(request)) return json(request, { ok: false, error: 'origin_not_allowed' }, 403);
  try {
    const payload = await sql('SELECT sea_api.get_request($1::text)::text AS result', [token]);
    const result = parseJsonCell(firstCell(payload));
    return json(request, { ok: true, request: result }, result?.found === false ? 404 : 200);
  } catch (error) {
    console.error('tracking_lookup_failed', error?.message || 'unknown');
    return json(request, { ok: false, error: 'tracking_lookup_failed' }, 500);
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      if (!allowedOrigin(request)) return new Response(null, { status: 403, headers: corsHeaders(request) });
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (request.method === 'GET' && path === '/health') return health(request);
    if (request.method === 'POST' && path === '/requests') return createRequest(request);

    const match = path.match(/^\/requests\/([0-9a-fA-F]{48})$/);
    if (request.method === 'GET' && match) return trackRequest(request, match[1].toLowerCase());

    return json(request, { ok: false, error: 'not_found' }, 404);
  },
};
