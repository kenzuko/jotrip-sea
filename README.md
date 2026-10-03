# JoTrip Sea - Bright Local Rebuild

Fresh rebuild started 2026-10-03.

## Baseline rule

This branch intentionally does not inherit the previous JoTrip Sea visual, content data, backend, booking flow, or runtime assumptions.

The previous repository state is only the parent commit for audit history. The new tree is created from scratch.

## Product direction

- Bright, calm, premium rather than dark or dashboard-like.
- Product-first: users can understand what they can book quickly.
- Local-first: Phu Quoc sea knowledge is part of the decision journey, not decorative storytelling.
- No fake price, fake availability, fake ratings, fake scarcity or unverified live sea conditions.
- Mobile-first responsive composition.
- JoTrip master logo retained as the only supplied brand asset, with `SEA` added as a UI sub-label rather than redrawing the logo.

## Fresh files

- `index.html` - new homepage and request flow
- `styles.css` - new design system and responsive layout
- `app.js` - new experience catalog/search/request UI
- `assets/jotrip-logo.png` - cropped from owner-supplied JoTrip logo, transparent background retained

## Current scope

The current rebuild is a real functional frontend foundation. The request modal intentionally does not send data yet. Live operational data, CRM/booking transport, weather intelligence, and production APIs must be integrated as new contracts rather than copied from the removed code.
