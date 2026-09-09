# Customer Support Helpdesk & Ticketing System (P14)

**Domain:** IT Services / Customer Support
**Course:** CIA-3 Project Development — 5th Semester, Christ University

## Team Details
| Name | Roll No | Department | Section |
|---|---|---|---|
| Aaron V Shibu | 2462002 | ADSE | 5BTCSAIML B |
| Abhishek Paul Johnson | 2462008 | ADSE | 5BTCSAIML B |
| Abel Francis | 2462005 | ADSE | 5BTCSAIML B |
| Abin Joseph George | 2462011 | ADSE | 5BTCSAIML B |

## Problem Statement
Support teams need a way to track customer issues from creation to resolution while
honoring response-time commitments (SLAs). This project implements a backend helpdesk
system where customers raise tickets, agents resolve them through a defined status
workflow with SLA deadline tracking and breach flagging, and managers monitor team
performance through aggregate reports — similar in spirit to Zendesk/Freshdesk at a
smaller scale.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Auth:** JWT (jsonwebtoken) + bcrypt password hashing
- **Validation:** express-validator
- **Docs/Testing:** Postman collection (see `/postman`)

## Setup Instructions
1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in real values:
   ```bash
   cp .env.example .env
   ```
3. Make sure MongoDB is running locally, or point `MONGO_URI` at an Atlas cluster.
4. (Recommended) Seed a manager account, an agent account, and default SLA rules:
   ```bash
   npm run seed
   ```
   This creates:
   - `manager@helpdesk.com` / `password123`
   - `agent@helpdesk.com` / `password123`
   - SLA rules for every category × priority combination
5. Start the server:
   ```bash
   npm run dev   # with nodemon
   # or
   npm start
   ```
6. Confirm it's up: `GET http://localhost:5000/api/health`

> Manager accounts are intentionally **not** self-registrable via `/api/auth/register`
> (only `customer`/`agent` roles can be chosen at signup) — use the seed script or
> create one directly in the database. This is a deliberate access-control decision,
> not an oversight.

## Implemented Modules (mapped to spec)
| # | Module | Where it lives |
|---|---|---|
| 1 | User Registration & Authentication | `authController.js`, `authRoutes.js` |
| 2 | Ticket Creation Module | `ticketController.createTicket` |
| 3 | Ticket Assignment Engine | `ticketController.assignTicket` |
| 4 | Ticket Status Workflow | `ticketController.updateTicketStatus` + `VALID_STATUS_TRANSITIONS` in `config/constants.js` |
| 5 | SLA Deadline Calculation | `utils/slaCalculator.js`, used on ticket creation |
| 6 | SLA Breach Flagging | `ticketController.checkAndFlagBreach`, run on every ticket read |
| 7 | Comment/Reply Thread | `commentController.js` (`isInternal: false`) |
| 8 | Internal Notes Module | `commentController.js` (`isInternal: true`, hidden from customers) |
| 9 | Escalation Workflow | `ticketController.escalateTicket` |
| 10 | Category & Priority Management | `slaRuleController.js`, `slaRuleRoutes.js` |
| 11 | Customer Satisfaction Rating | `ratingController.js` |
| 12 | Agent Workload Dashboard | `reportController.getAgentWorkload` |
| 13 | Manager Reports & Analytics | `reportController.getSlaComplianceReport`, `getCategoryBreakdown` |

## API Endpoint Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register customer/agent |
| POST | `/api/auth/login` | Public | Login, returns JWT |

### Tickets
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/tickets` | Customer | Create a ticket (auto-calculates SLA due date) |
| GET | `/api/tickets` | Any | List tickets (scoped by role; supports `?status=` `?priority=`) |
| GET | `/api/tickets/:id` | Owner / Assigned Agent / Manager | Get one ticket (checks SLA breach on read) |
| PUT | `/api/tickets/:id/assign` | Manager | Assign ticket to an agent |
| PUT | `/api/tickets/:id/status` | Assigned Agent / Manager | Move ticket through workflow states |
| PUT | `/api/tickets/:id/escalate` | Agent / Manager | Escalate to a senior agent/manager |

### Comments
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/tickets/:id/comments` | Owner / Assigned Agent / Manager | Add reply or internal note |
| GET | `/api/tickets/:id/comments` | Owner / Assigned Agent / Manager | List thread (customers never see internal notes) |

### Ratings
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/tickets/:id/rating` | Owner | Rate a **Closed** ticket (1–5) |
| GET | `/api/tickets/:id/rating` | Owner / Assigned Agent / Manager | Get the rating |

### SLA Rules
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/sla-rules` | Manager | Create a category+priority → resolutionHours rule |
| GET | `/api/sla-rules` | Any | List all SLA rules |
| PUT | `/api/sla-rules/:id` | Manager | Update resolutionHours |

### Reports & Dashboards
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/agents/:id/workload` | Self (agent) / Manager | Open ticket count + avg resolution time |
| GET | `/api/manager/reports/sla` | Manager | SLA compliance rate |
| GET | `/api/manager/reports/volume` | Manager | Ticket volume by category |

Full request/response samples with headers are in the exported Postman collection
(`/postman/helpdesk.postman_collection.json`).

## Database Schema Summary

```
users ──┬──< tickets (customerId)
        ├──< tickets (assignedAgentId)
        ├──< comments (authorId)
        └──< ratings (customerId)

tickets ──< comments (ticketId)
tickets ──< ratings (ticketId, 1:1 — unique index)
tickets ── embeds statusHistory[] (small, always read with parent, never queried alone)

slaRules  (standalone lookup table: category + priority → resolutionHours)
```

**Reference vs. embed decisions:**
- `customerId` / `assignedAgentId` on `tickets` → **referenced**, because the `users`
  document is large, shared across many tickets, and updated independently (e.g. a
  name change shouldn't require touching every ticket).
- `statusHistory` on `tickets` → **embedded**, because it's small, always read
  together with the ticket, and never queried on its own.
- `comments` → **separate collection, referenced** by `ticketId`, not embedded in the
  ticket, because a ticket can accumulate an unbounded number of comments over its
  lifetime (risk of hitting MongoDB's 16MB document limit) and comments are paginated
  independently in the UI.
- `ratings` → **separate collection** with a unique index on `ticketId` to enforce
  "one rating per ticket" at the database level, not just in application logic.

## Known Limitations / Scope Boundaries
- No email/SMS notifications — SLA breach and escalation are reflected in API
  responses only, not pushed externally.
- No automated cron job for breach detection; breach status is (re)checked
  opportunistically whenever a ticket is read via `GET /api/tickets/:id`. This is a
  documented design choice to keep the project self-contained for demo purposes.
- Single currency/locale/timezone assumption — SLA hours are wall-clock hours, no
  business-hours-only calculation.
- No frontend included by default (Postman collection is the primary demo path);
  a minimal HTML/JS frontend can be added as a bonus.
