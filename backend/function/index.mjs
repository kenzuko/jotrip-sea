import { timingSafeEqual } from 'node:crypto';

const DATABASE_URL = process.env.DATABASE_URL;
const OPS_TOKEN = process.env.OPS_TOKEN;
const ALLOWED_ORIGINS = new Set([(process.env.ALLOWED_ORIGIN || 'https://kenzuko.github.io').trim()]);

if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
if (!OPS_TOKEN) throw new Error('OPS_TOKEN is required');

const db = new URL(DATABASE_URL);
const SQL_ENDPOINT = `https://${db.hostname}/sql`;

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
    headers['access-control-allow-methods'] = 'GET,POST,PATCH,OPTIONS';
    headers['access-control-allow-headers'] = 'Content-Type,Authorization,X-Idempotency-Key';
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

function prepareParam(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

async function sql(query, params = []) {
  const response = await fetch(SQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Neon-Connection-String': DATABASE_URL,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'true',
    },
    body: JSON.stringify({ query, params: params.map(prepareParam) }),
  });

  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok) {
    const error = new Error(payload?.message || `database_query_failed_${response.status}`);
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

function tokenEqual(received) {
  if (!received || typeof received !== 'string') return false;
  const expected = Buffer.from(OPS_TOKEN);
  const candidate = Buffer.from(received);
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function requireOps(request) {
  const auth = request.headers.get('authorization') || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match || !tokenEqual(match[1])) {
    const error = new Error('unauthorized');
    error.httpStatus = 401;
    throw error;
  }
}

async function readBody(request) {
  const length = Number(request.headers.get('content-length') || '0');
  if (length > 32768) {
    const error = new Error('payload_too_large');
    error.httpStatus = 413;
    throw error;
  }
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    const error = new Error('invalid_json');
    error.httpStatus = 400;
    throw error;
  }
}

async function health(request) {
  try {
    const payload = await sql('SELECT current_database()::text, current_user::text');
    const row = payload?.rows?.[0] || [];
    return json(request, {
      ok: true,
      service: 'jotrip-sea-api',
      version: '1.1.0',
      database: Array.isArray(row) ? row[0] : null,
      role: Array.isArray(row) ? row[1] : null,
    });
  } catch (error) {
    console.error('health_failed', error?.message || 'unknown');
    return json(request, { ok: false, service: 'jotrip-sea-api' }, 503);
  }
}

async function createRequest(request) {
  if (!allowedOrigin(request)) return json(request, { ok: false, error: 'origin_not_allowed' }, 403);
  const body = await readBody(request);

  const service = clean(body.service);
  const tripDate = clean(body.trip_date ?? body.date);
  const pax = Number(body.pax);
  const customerName = clean(body.customer_name ?? body.name);
  const hotelArea = clean(body.hotel_area ?? body.area ?? body.hotel);
  const options = body.options && typeof body.options === 'object' && !Array.isArray(body.options) ? body.options : {};
  const customerContact = clean(body.customer_contact ?? body.contact ?? body.phone);
  const customerNotes = clean(body.customer_notes ?? body.notes ?? body.note);
  const idempotencyKey = clean(request.headers.get('x-idempotency-key')) || clean(body.idempotency_key);

  if (!service || !tripDate || !Number.isInteger(pax) || !customerName) {
    return json(request, { ok: false, error: 'missing_required_fields' }, 400);
  }

  try {
    const payload = await sql(
      `SELECT sea_api.create_request(
        $1::text,$2::date,$3::integer,$4::text,$5::text,$6::jsonb,$7::text,$8::text,$9::text
      )::text AS result`,
      [service, tripDate, pax, customerName, hotelArea, JSON.stringify(options), customerContact, customerNotes, idempotencyKey]
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

function todayVietnam() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const m = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${m.year}-${m.month}-${m.day}`;
}

function plusDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function listOpsRequests(request, url) {
  requireOps(request);
  const from = clean(url.searchParams.get('from')) || todayVietnam();
  const to = clean(url.searchParams.get('to')) || plusDays(from, 14);
  const status = clean(url.searchParams.get('status'));
  const payload = await sql(
    'SELECT sea_api.ops_list_requests($1::date,$2::date,$3::text)::text AS result',
    [from, to, status]
  );
  return json(request, { ok: true, requests: parseJsonCell(firstCell(payload)) || [] });
}

async function updateOpsRequest(request, requestCode) {
  requireOps(request);
  const body = await readBody(request);
  const payload = await sql(
    `SELECT sea_api.ops_update_request(
      $1::text,$2::text,$3::text,$4::text,$5::text,$6::text,$7::text,$8::text
    )::text AS result`,
    [
      requestCode,
      clean(body.status),
      clean(body.sea_suitability),
      clean(body.operation_status),
      clean(body.availability_status),
      clean(body.public_note),
      clean(body.private_note),
      clean(body.actor) || 'ops-api',
    ]
  );
  const result = parseJsonCell(firstCell(payload));
  return json(request, { ok: true, request: result }, result?.found === false ? 404 : 200);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (request.method === 'OPTIONS') {
        if (!allowedOrigin(request)) return new Response(null, { status: 403, headers: corsHeaders(request) });
        return new Response(null, { status: 204, headers: corsHeaders(request) });
      }

      if (request.method === 'GET' && (path === '/' || path === '/health' || path === '/health/db')) return health(request);
      if (request.method === 'POST' && path === '/requests') return createRequest(request);

      const publicMatch = path.match(/^\/requests\/([0-9a-fA-F]{48})$/);
      if (request.method === 'GET' && publicMatch) return trackRequest(request, publicMatch[1].toLowerCase());

      if (request.method === 'GET' && path === '/ops/requests') return listOpsRequests(request, url);
      const opsMatch = path.match(/^\/ops\/requests\/(JTSEA-\d{6}-[0-9A-F]{10})$/i);
      if (request.method === 'PATCH' && opsMatch) return updateOpsRequest(request, opsMatch[1].toUpperCase());

      return json(request, { ok: false, error: 'not_found' }, 404);
    } catch (error) {
      if (error?.httpStatus === 401) return json(request, { ok: false, error: 'unauthorized' }, 401);
      if (error?.httpStatus === 400 || error?.httpStatus === 413) {
        return json(request, { ok: false, error: error.message }, error.httpStatus);
      }
      console.error('jotrip_sea_api_failed', error?.message || 'unknown');
      return json(request, { ok: false, error: 'internal_error' }, 500);
    }
  },
};
