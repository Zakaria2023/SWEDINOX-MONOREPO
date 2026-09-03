# Import purchase invoices

`Overviews → Purchase → Import purchase invoices`. Ours: not yet built.

Not a list of invoices — a message log for the automated invoice-import
pipeline (EDI / electronic invoicing from suppliers). Each row is one inbound
message and what happened processing it, not a purchase invoice record.

**Filters**: `Creation date` (from / u/i — defaulted to today in the capture),
`Messages with error to be processed` (checkbox, unchecked), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Company ·
Show Purchase invoice · Show File · Toon ontvangen bericht (untranslated Dutch —
see question 6).
**View open when captured**: none selected (blank).
**Grid was empty**, so no example values were readable.

## Columns — captured, not yet matched

| # | Reference heading | Notes |
|---|---|---|
| 1 | Created on | |
| 2 | Adjusted on | |
| 3 | Adjusted by | |
| 4 | Final destination | see question 2 |
| 5 | Specification | see question 2 |
| 6 | Factuurstatus | **untranslated Dutch** — "Invoice status" |
| 7 | Role | see question 3 |
| 8 | Invoice no. | |
| 9 | Supplier | |
| 10 | Work panel | see question 4 |
| 11 | Receive data storage type | tooltip confirmed |
| 12 | Receive data | the inbound payload, or a pointer to it |
| 13 | Data sent storage type | tooltip confirmed |
| 14 | Data sent | the outbound payload (e.g. an acknowledgement) |
| 15 | Invoked method | the integration method/endpoint called |
| 16 | Retry possible | checkbox |
| 17 | Last error message | |
| 18 | Error message | tooltip confirmed |
| 19 | User interaction required | checkbox |

## 🔴 What is needed before this can be built

**1. Is this in scope at all?**
Every column describes an integration message (storage type, invoked method,
retry, error) — not a purchase invoice's business content. If nothing feeds
this pipeline in practice, or we have no equivalent inbound channel to
mirror, the whole screen may not need building.
→ *In the old system:* ask whether purchase invoices actually arrive
electronically today (EDI, a supplier portal, e-mail parsing), or whether this
screen sits empty/unused. If it is not actually used, it can be skipped
entirely rather than built.

**2. `Final destination` and `Specification` — what do they name?**
Possibly which system/module the message routes to, and which message format
(e.g. UBL, EDIFACT) it is specified in.
→ *In the old system:* widen both columns on a row with data and read their
values.

**3. `Role` — whose role?**
Could be the message's role in a conversation (sender/receiver), or a workflow
role responsible for handling it.
→ *In the old system:* widen the column and read a few values.

**4. `Work panel` — a queue name, or a literal screen reference?**
→ *In the old system:* open a row and check whether double-clicking it opens a
specific screen — if so, that screen is what `Work panel` names.

**5. `Receive data` / `Data sent` — payloads, or pointers to them?**
Each is paired with its own storage-type column, which suggests the value may
be a pointer (file location) rather than inline text.
→ *In the old system:* open a row with data in both and use `Show File` to
check whether it opens the raw payload — that would confirm they are pointers.

**6. Translate `Factuurstatus` and `Toon ontvangen bericht`.**
"Factuurstatus" = "Invoice status". "Toon ontvangen bericht" = "Show received
message" — a toolbar button, presumably opening the raw inbound message for
the selected row.
