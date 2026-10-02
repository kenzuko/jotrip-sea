# JoTrip Sea Request Ledger

This directory versions the public request-ledger backend used by JoTrip Sea.

## Runtime

- Hosting: Neon Function `jotripseaapi`
- Runtime database: the Neon project's default `neondb`
- Database schemas: `sea` for private tables and `sea_api` for narrow RPC functions
- The Function receives `DATABASE_URL` from Neon at runtime. No database credential belongs in this repository or in browser JavaScript.

## Public surface

- `POST /requests` creates an idempotent request and returns a canonical `JTSEA-...` code plus a random public tracking token.
- `GET /requests/<public_token>` returns only sanitized tracking data.
- `GET /health` is a minimal service/database health check.

The browser never receives customer data from the tracking endpoint. Customer name, contact and private notes remain in `sea.requests` and are not returned by `sea_api.get_request`.

## Ops surface

The database contains private ops RPCs for list/update, but the public Neon Function deliberately does not expose them. They are reserved for a future authenticated JoTrip Ops adapter.

## Status model

Overall request status: `NEW`, `CHECKING`, `CONFIRMED`, `MODIFY`, `UNAVAILABLE`, `CANCELLED`, `EXPIRED`.

Independent truth checks:

- sea suitability: `PENDING`, `GO`, `MODIFY`, `HOLD`, `CANCEL`
- operation: `PENDING`, `OPERATING`, `LIMITED`, `NOT_OPERATING`
- availability: `PENDING`, `AVAILABLE`, `LIMITED`, `UNAVAILABLE`

`CONFIRMED` is the only overall state that means the trip has been confirmed.
