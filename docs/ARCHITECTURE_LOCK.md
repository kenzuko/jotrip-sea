# JoTrip Sea - UI & Architecture Lock V1

## Role
Public website for Phu Quoc sea experiences. It does not replace Open Phu Quoc, JoTrip DMC, the existing WordPress fishing site, or Fishing Desk.

## Brand idea
**Người bản địa đưa bạn đi xa hơn điểm đến.**

This is a point of view, not a marketing claim to repeat everywhere. Copy stays factual and local. Emotion comes from photography, typography, layering, rhythm and real human details.

## UX order
1. Service first.
2. Useful facts next.
3. Local knowledge where it changes a decision.
4. Sea intelligence below the service layer.
5. Transactional UI only when the guest wants to act.

## Visual DNA
- Layered, editorial, alive.
- Large real imagery mixed with practical UI.
- No price wall on homepage.
- No fake urgency, fake reviews, fake scarcity or guaranteed catch claims.
- Shared components: header, typography, buttons, color tokens, form controls.
- Page anatomy is service-specific, not cloned.

## System boundaries
- `jotrip-sea`: public content, experience pages, discovery, public conditions display, availability request UI.
- `phuquocfishingtours`: Fishing Desk, operations, assignments, payment/settlement, customer trip link.
- Open Phu Quoc Weather: weather/marine source. JoTrip Sea consumes a safe public interpretation layer only.
- Existing `phuquocfishingtours.com` WordPress stays live during build and migration analysis.

## Content truth rule
If data is not verified, do not present it as fact. Preview/provisional content may exist in development but must be labeled in source data and blocked from production publishing until reviewed.
