# JoTrip Sea Request Ledger

This directory versions the request-ledger backend used by JoTrip Sea.

## Runtime

- Hosting: Neon Function `jtseaapi`
- Runtime database: `jotrip_sea`
- Neon project: `phuquoclux-production`, Singapore region
- Database schemas: `sea` for private tables and `sea_api` for narrow RPC functions
- Database/schema owner: `jotrip_sea_app`
- Function database role: `jotrip_sea_runtime`
- The Function receives `DATABASE_URL`, `OPS_TOKEN` and `ALLOWED_ORIGIN` only from Neon runtime environment. No database credential or ops token belongs in this repository or browser JavaScript.

## Source of truth

Business validation and state transitions live in PostgreSQL RPCs under `sea_api`:

- `sea_api.create_request(...)`
- `sea_api.get_request(...)`
- `sea_api.ops_list_requests(...)`
- `sea_api.ops_update_request(...)`

`backend/function/index.mjs` is only the HTTP/CORS/auth gateway. It must not duplicate request-state business rules that already exist in the RPC layer.

## Public surface

- `POST /requests` creates an idempotent request and returns a canonical `JTSEA-...` code plus a random 48-hex public tracking token.
- `GET /requests/<public_token>` returns sanitized tracking data.
- `GET /health` and `GET /health/db` are service/database health probes.

The tracking endpoint never returns customer name, phone/WhatsApp or private ops notes. The public token is unguessable and must not be replaced by a sequential database ID.

## Ops surface

- `GET /ops/requests?from=YYYY-MM-DD&to=YYYY-MM-DD&status=...`
- `PATCH /ops/requests/<JTSEA-code>`

Both require `Authorization: Bearer <OPS_TOKEN>`. The token is server-side only and must never be embedded in the GitHub Pages app. A proper authenticated JoTrip Ops UI can sit in front of this adapter later.

## Status model

Overall request status: `NEW`, `CHECKING`, `CONFIRMED`, `MODIFY`, `UNAVAILABLE`, `CANCELLED`, `EXPIRED`.

Independent truth checks:

- sea suitability: `PENDING`, `GO`, `MODIFY`, `HOLD`, `CANCEL`
- operation: `PENDING`, `OPERATING`, `LIMITED`, `NOT_OPERATING`
- availability: `PENDING`, `AVAILABLE`, `LIMITED`, `UNAVAILABLE`

`CONFIRMED` is the only overall state that means the trip has been confirmed.

## Security note

The current Neon management-created LOGIN role inherits `neon_superuser` in this project. Direct table grants were revoked where possible and the gateway uses static parameterized calls to four `SECURITY DEFINER` RPCs with fixed `search_path`, but the runtime credential still has a larger platform-level blast radius than ideal. Replace it with a true least-privilege PostgreSQL LOGIN role when Neon/account tooling permits creating one without `neon_superuser` membership.
