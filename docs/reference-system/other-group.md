# Other group — the smaller screens (items F3–F9)

`Overviews → Other`. Complaints and Complaint lines have their own doc:
[complaints.md](complaints.md).

The group, photographed 16-9-2026: `Complaints`, `Complaint lines`,
`External documents`, `Read external documents`, `Actions`,
`Balanced Scorecard`, `Transport by region`, `SigmaNest geblokkeerde orders`,
`Scanners purchase and sales`.

---

## F6. External documents — empty, and nothing to filter (16-9-2026)

**Filter block: none.** The `from` / `u/i` header is drawn with no filter rows
under it, so there is nothing to widen — the grid shows everything there is.
**An empty grid here is evidence**, not a filter mistake.

**Toolbar:** `Save as Excel` · `Show in Excel` · `Print` · `Show File` (greyed —
no row selected) | `Purchase lines` · `Warehouse workorders` ·
`Orders and Quotes` · `Prod…`.

**Columns:** `Sequence` · `Code` · `Description` · `Filename` · `Read` ·
`Last read`.

**What it is:** a list of documents (a file each, opened with `Show File`)
that users are expected to read. F7 settles the meaning of `Read`: it is
**people reading**, not a file import — see below.

**Rows: 0.** Never used on this database.

**For `apps/dashboard`:** nothing to build. Candidate for K3 (features shipped
but unused).

## F7. Read external documents — empty, no filter (16-9-2026)

**Filter block: none**, same as F6. **Rows: 0.**

**Toolbar:** `Save as Excel` · `Show in Excel` · `Print` | `Purchase lines` ·
`Warehouse workorders`.

**Columns:** `User` · `Document` · `Code` · `Read` · `Last read`.

**What it is:** the per-user side of F6 — one row per **user × document**, with
whether that user has read it and when. Together the two screens are a
**read-and-acknowledge register**: publish a document (a procedure, a
instruction), and track who has opened it. Not an import.

**For `apps/dashboard`:** nothing to build. Never used; candidate for K3
together with F6.

## F8. Actions — empty (16-9-2026)

**Filter:** `Deadline` from `1-1-2024` u/i `16-9-2026` — the only filter.
**Rows: 0.**

**Toolbar:** `Save as Excel` · `Show in Excel` · `Print` · `Show Action`
(greyed) | `Purchase lines` · `Warehouse workorders` · `Orders and Quotes` ·
`Production workorders`.

**Columns:** `Number` · `Action type` · `Assigned to` · `Created` ·
`Created by` · `Deadline` · `Description` · `Executed?` · `Executed by` ·
`Executed on` · `Explanation`.

**What it is:** a to-do assigned to a user — a typed task with a deadline, ticked
off with who did it, when, and a note. `Action` is one of the 22 document types
in `Bestand → Nieuw`.

**The schema backs it** ([database-schema.md](database-schema.md)):

- `ACTION`: `CODE` (the number), `ACTIONTYPE`, `ASSIGNEDTO`, `CREATED`/`CREATEDBY`,
  **`DEADLINE` not null**, `DESCRIPTION` not null, `COMPLETED` bit,
  `COMPLETEDBY`, `COMPLETEDON`, `COMPLETIONNOTES`, `AFFILIATE`.
- `ACTION_TYPE`: a maintainable list — `NAME1`…`NAME5` (one per language),
  `SORTORDER`, `ACTIVE`, `CAN_EDIT`, `CAN_DELETE`.
- `ACTION_TYPECONFIGURATION`: per action type, a default **assign-to user** and
  **assigned-from user** — an action of a given type routes itself.
- `ACTION_HEADERVALUES`: header XML — an action can carry values from the
  record it was raised on.

**Is the empty grid trustworthy?** Yes, as far as it goes: every action must
have a deadline, the database is frozen around May 2025, and the window covers
2024 to today. An action deadlined before 2024 would not show — unlikely to
matter.

**For `apps/dashboard`:** the header menu already has an `Actions` tab, but that
is the **New-document menu**, not this entity. There is no `Actions` table.
Unused in the reference; the `/tasks` worklists (P2) cover the "who must do
what" need. Candidate for K3.

## F3. Balanced Scorecard — nine KPIs, never measured (16-9-2026)

**Filter block: none.** **Rows: 9**, every value and target `0,00`.

**Toolbar:** `Save as Excel` · `Show in Excel` · `Print` · **`Target…`** ·
**`History…`** | `Purchase lines` · `Warehouse workorders` · …
Right-click a row: `Target…` · `History…`.

**Columns:** `Category` · `KPI` · `Value` · `Target` · `U.` · `Status` (a
coloured ball, green on all) · `Trend` (an arrow, `↔` on all).

| Category | KPI | Unit |
| --- | --- | --- |
| Sale | GrossProfit | % |
| Purchasing | ComplaintsPurchasingOrders | % |
| Purchasing | Turnover rate | % |
| Logistics | Loading degree | % |
| Logistics | *(no name)* | Euro |
| Sale | ComplaintsOrders | % |
| Sale | *(no name)* | % |
| Logistics | DeviationCount | % |
| Logistics | Saw waste | % |

Two indicators show **no name** — most likely their English name column
(`NAME2`) is empty while the Dutch `NAME1` is filled.

**`Target…` dialog** (`ComplaintsPurchasingOrders Target…`): `New target` [ ] %,
`Current target: 0,00 %`, and a `History` grid `t/m` (up to) · `Target` —
empty. `OK` / `Cancel`. Setting a target closes the old one with an end date.

**`History…` dialog** (`ComplaintsPurchasingOrders History`): grid `Measured` ·
`Value` — **empty**. `Close`.

**The schema** ([database-schema.md](database-schema.md)):

- `SCORECARD_CATEGORY` — Sale / Purchasing / Logistics, names in 5 languages.
- `SCORECARD_INDICATOR` — the KPI: `CATEGORY`, `UNIT`, `TYPE_CODE`,
  **`BATCHTASK_TYPE`** (the batch job that computes it), **`IS_MANUAL`**
  (typed in instead), **`YELLOW_PERCENTAGE`** (how far from target turns the
  ball yellow).
- `SCORECARD_PROFILE` + `SCORECARD_PROFILE_INDICATOR` — which KPIs a profile
  shows, in which `POSITION`, with its `CURRENT_TARGET` and its own
  `YELLOW_PERCENTAGE`.
- `SCORECARD_TARGET_HISTORY` — every target set (`TARGET`, `CREATED`).
- `SCORECARD_VALUE` — every measurement (`VALUE`, `CREATED`).

**How it works:** a batch job measures each KPI and appends a `SCORECARD_VALUE`.
`Value` = the latest measurement; `Trend` = latest against the one before;
`Status` = green on or better than target, yellow within
`YELLOW_PERCENTAGE` of it, red beyond.

**Rows exist, measurements do not:** both history grids are empty, so no job ever
wrote a value and nobody set a target. The all-green `0 = 0` is the default,
not a result. The batch scheduler is off on this copy (K10), but the empty
target history shows it was not used live either.

**For `apps/dashboard`:** `/balanced-scorecard` already lists these nine rows
statically with 0 / 0, green and flat — which matches what the reference shows
today. Making it real needs the nine formulas, none of which the reference
documents. Candidate for K3.

## F4. Transport by region — 1 439 rows × 13 columns (16-9-2026)

`exports/f4-transport-by-region.tsv` (`Trasport by region.xlsx`). Transport
dates 7-1-2025 → 2-9-2026. Right-click: **`Show Company`** only.

**Columns:** `Transport date` · `Delivery address (City)` · `Region` ·
`Delivery address (Postal code)` · `Vehicle` · `Delivery address (Name)` ·
`Kg. (p) total` · `Kg(a) total` · `Length (largest)` · `Trip status` ·
`Source status (lowest)` · **`Lines`** · **`Action`**.

### The grain: one transport (stop), not one trip

Each row is one **transport work order** — a delivery to, or pick-up from, one
address on one date — with its lines rolled up: `Kg` summed, `Length` the
largest, `Lines` counted (1 on 539, 2 on 305, up to 27 distinct counts), and
`Source status` the **lowest** status among the documents it carries. The trip
it rides on gives `Vehicle` and `Trip status`. 57 rows share date + address +
vehicle — separate transports to the same stop.

### Values

| Field | Values |
| --- | --- |
| Region | The Netherlands 932 · Germany 235 · Belgium 145 · Spain/Portugal 49 · UK 45 · Baltic states 13 · Eastern europe 8 · Italy 6 · France 4 · Asia 1 · blank 1 |
| Vehicle | ADO NL 753 · ADO BE 128 · AFHAAL 98 · JONKER DE 94 · CUVELJE 85 · **VERVALLEN ORDERS 57** · ERC 43 · INOX TRANSPORT 18 · INCIDENTEEL 15 · ADO DE 12 · JONKER NL 11 · … · **blank 109** |
| Trip status | Completed 1 278 · New 109 · Loading list 22 · Loading done 12 · Scheduled 11 · Loaded 7 |
| Source status (lowest) | Ready 1 290 · Expired 80 · In progress 39 · Workorders created 21 · New 8 · Released 1 |
| Action | Deliver 1 362 · Pick-up 77 |

- **`Region` is the delivery address's own field** (the C4 Addresses export has a
  `Region` column), not derived from the postcode: `Spain/Portugal`,
  `Baltic states`, `Eastern europe` are groupings. The one blank is an address
  without a region.
- **Blank `Vehicle` ⇔ trip status `New`** (109 of 109) — not yet planned on a
  vehicle.
- A "vehicle" is really a **carrier or route** (`ADO NL`, `JONKER DE`), and two
  are not vehicles at all: `AFHAAL` (customer collects) and
  **`VERVALLEN ORDERS`** (*expired orders*) — a dummy trip that parks lapsed
  transports; 19 of its 57 carry source status `Expired`.
- `Kg(a) total` is 0 on 105 rows, 62 of them trips still `New`; `Kg(a)` is
  above `Kg(p)` on 131 and below on 228.
- `Pick-up` = collecting goods (returns, material to or from a processor).

### Against `apps/dashboard`

`/transport-by-region` reads `TransportTrips` — **one row per trip**, the wrong
grain — and says region, address, statuses and length "have no source". It
also shows a `Delivery address code` column the reference does not have, and
lacks `Lines` and `Action`. To match: one row per transport work order, address
fields and `Region` from its delivery address, `Vehicle`/`Trip status` from its
trip, `Kg`/`Length`/`Lines`/lowest source status rolled up from its lines,
`Action` deliver/pick-up, and a `Show Company` row action.

## F5. SigmaNest geblokkeerde orders — empty, no filter (16-9-2026)

**Filter block: none. Rows: 0.**

**Toolbar:** `Print` · `Show Product` · `Show Company` · `Show Order` ·
**`Nieuwe Order`** (*new order*) — all greyed with no row | `Purchase lines` ·
`Warehouse workorders`. No `Save as Excel` / `Show in Excel` on this screen, and
`View` is greyed.

**Columns — still Dutch in the reference:**

| Reference | English |
| --- | --- |
| `WorkOrder` | Work order |
| `Klant` | Customer |
| `Leverdatum` | Delivery date |
| `Inkooporder` | Purchase order |
| `Verkooporder (e2t)` | Sales order (easy2trade) |

**What it is:** SigmaNest (the nesting/cutting software, see
[nesting.md](nesting.md)) holds work orders that it could not pass back to
easy2trade. Each row pairs a SigmaNest work order with the customer, delivery
date, the purchase order and the easy2trade sales order; `Nieuwe Order` would
create the missing sales order from it. The schema has **no `SIGMA…` table**, so
the list is read live from the SigmaNest link, not stored.

**For `apps/dashboard`:** nothing to build — no SigmaNest link exists here.
Sidebar label must be English: `SigmaNest blocked orders`
([ENGLISH-ONLY-TODO.md](ENGLISH-ONLY-TODO.md)).

## F9. Scanners purchase and sales — empty, 90 columns (16-9-2026)

**Rows: 0.** Header exported: `exports/f9-scanners-purchase-and-sales-columns.tsv`
(`Scanners Purchase and sales.xlsx`).

### The columns are Order advice plus a scanned line

Against the 72-column Order advice full view, this screen has **every Order
advice column except `Supplier`, `Supplier code` and `OrderQty (Pur.U.)`**, and
adds 21:

| Group | Columns |
| --- | --- |
| The product | `Standard product`, **`Preferred location`**, `Blocked for purchasing`, `Blocked for sale` |
| The scan | **`Purchase`**, **`Sales`** (which kind of line it made), `Qty order line`, `U. order line`, `Completed`, `Company`, `Company code` |
| The line it created | `Quote`, `Quote line`, `Quote line status`, `Order`, `Order line`, `Order line status`, `Line created by`, `Line continued by` |
| Audit | `Created`, `Altered` |

(`Stoch (Pur.U.)` is the reference's own typo for `Stock`.)

### The schema

`SCAN_SALES_PURCHASE_INTERMEDIATE`: `PRODUCT`, `QUANTITY`, `QUANTITY_UNITID`,
`COMPANY_ID`, **`ISSALES`**, **`ISPROCESSED`**, `PURCHASE_ID` /
`PURCHASE_LINEID`, `SALES_ID` / `SALES_LINEID`, `CREATED`/`CREATEDBY`.
Plus two lookup lists, `SCAN_ACTION` and `SCAN_CONTEXT`.

### What it is

A **handheld scanner in the warehouse**: someone scans a product on the rack,
types a quantity and a company, and marks it **sales** or **purchase**. The scan
lands in an intermediate table; processing it turns it into a **sales order
line** or a **purchase quote/order line** (`ISPROCESSED`, `Completed`). The
screen shows each scan beside the product's full order advice, so the buyer
sees stock, consumption and advice while deciding what the scan becomes.

Never used on this database.

**For `apps/dashboard`:** nothing to build now. If scanning is wanted later, the
Order advice engine (`order-advice/actions.ts`) already computes every advice
column this screen repeats. Candidate for K3.
