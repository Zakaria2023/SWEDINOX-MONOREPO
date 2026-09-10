# Warehouse- and production workorders

`Overviews → Logistics → Warehouse- and production workorders`.
Ours: `/warehouse-and-production-workorders`.

**Both work-order streams in one list.** Warehouse and production orders are
planned and reported differently, but the floor wants one queue of everything
outstanding, so this screen merges them.

**Filter**: `Workorder date` from / u/i, `Show Data`.
**Views**: `Geteld` (counted) · `picken` · `-empty-`
**Toolbar**: Save as Excel · Show in Excel · Print | Purchase lines ·
Warehouse workorders · Orders and Quotes · Production workorders ·
Transport workorders

---

## ✅ `Weight deviation` is a percentage, and it is not `Kg(dif)`

Two columns on two screens compare planned against actual, and they point
opposite ways. Conflating them is easy and wrong:

| Column | Where | Formula | Sign when short |
|---|---|---|---|
| `Kg(dif)` | Warehouse workorders | `Kg(a) − Kg(p)`, in kilograms | negative |
| **`Weight deviation`** | **here** | `\|Kg(p) − Kg(a)\| ÷ Kg(p) × 100` | **always positive** ⚠️ *corrected — see the export section below* |

Proved by the grid itself. Every `New` row reads exactly **100,00** with
`Kg(a)` of 0 — nothing reported, so the whole planned weight is outstanding:

| Type | Kg(p) | Kg(a) | Status | Weight deviation |
|---|---|---|---|---|
| `Unloading` | 288 | 0 | `New` | **100,00** |
| `Unloading` | 9 300 | 0 | `New` | **100,00** |
| `Picking` | 3 228 | 3 228 | `Approved` | **0,00** |
| `Pick-up` | 7 185 | 7 185 | `Approved` | **0,00** |

⚠️ Ours had `weightDeviation: kgActual - kgPlanned` — the wrong quantity, in the
wrong unit, with the wrong sign. Fixed as `weightDeviationPercent` in
`lib/helpers.ts`, returning `null` when nothing was planned, since a share of
zero is unanswerable rather than a hundred per cent.

The table also colour-codes it now in the direction the reference implies: a
**positive** deviation is the one worth noticing.

---

## 🔑 What moves a work order `New → Released → Approved`

This screen answers [warehouse-workorders.md](warehouse-workorders.md) open
question 2, via two columns the Warehouse workorders screen does not carry:

- **`Date released`**
- **`Time period (Time...)`** — and its values are **half-hour slots**:
  `00:00 - 00:30`, `08:30 - 09:00`, `10:30 - 11:00`, `15:00 - 15:30`

Which reads plainly off the data:

| State | `Date released` | `Time period` | `Kg(a)` | `Reported as completed on` |
|---|---|---|---|---|
| `New` | *blank* | `00:00 - 00:30` *(the default)* | 0 | *blank* |
| `Released` | a date | **a real half-hour slot** | 0 | *blank* |
| `Approved` | a date | a real slot | filled | **a timestamp** |

So **releasing is scheduling**: it books the work order into a named half-hour
on a named day, in a named `Warehouse section` and `Subsection`. And
**approving is reporting**: it stamps `Reported as completed on` and fills the
actuals.

That is also why [Warehouse capacity](warehouse-capacity.md) can count work
orders per section per day — releasing is what consumes a slot.

The `New` rows carry no section, no year, no month and no release date at all,
confirming that none of that is decided until release.

---

## The test data is visible in here

Four `New` unloadings against purchase order `400614` name the company
**`Swedinox, HELSINBORG`**, and one against `400988` names
`HW-Inox GmbH, RATINGEN-LI...`. Those are the rows created on the test install
while trying to receive goods — the ones that could never be approved because
`Batchscheduler is not active`.

Which is the final piece of that puzzle: the work orders *were* being raised
correctly all along. Nothing was approving them.

---

## Columns

**Identity** `Workorder#` · `Line#` · `Workorder type` · `Workorder date` ·
`Workorder status`

**Where** `Warehouse section` · `Subsection` · `Resource` *(`-leeg-`
throughout — empty)*

**How much** `Qty(p)` · `Qty(a)` · `QtyU` · `Kg(p)` · `Kg(a)` ·
`Weight deviation`

**Scheduling** `Date released` · `Time period` · `Year` · `Month`

**Why and who** `Order#` · `Company` · `Modified by` ·
`Reported as completed on` · `Sawing type`

`Modified by` here holds short uppercase handles — `RICHARD`, `INAD`, `FARIEL`,
`ADRIE` — where the Warehouse workorders screen holds full names
(`Richard van Slooten`, `Fariël Janmahomed`). Same people, two representations.

---

## What is still open

1. **`Resource`** is `-leeg-` on every row, so what it would hold is unknown. On
   the Warehouse workorders screen it is blank too. Possibly a person or a
   forklift.
2. **`Sawing type`** is blank on every row here and only populated on
   [Nesting](nesting.md).
3. **Whether the half-hour slot is capacity-checked on release** — i.e. whether
   a full slot refuses a release, or merely shows as over-booked on
   [Warehouse capacity](warehouse-capacity.md).

---

# The 13 610-line export

**9-9-2026.** `View` = `-empty-`, `Workorder date` from `1-1-2024`,
`Show in Excel` → `exports/warehouse-and-production-workorders.tsv`,
**13 610 lines × 23 columns**.

**Columns**: `Warehouse section` · `Year (Date released)` ·
`Month (Date released)` · `Date released` · **`Time period (Time released)`** ·
`Workorder#` · `Line#` · `Qty(a)` · `QtyU` · `Kg(a)` · `Resource` ·
`Sawing type` · `Subsection` · `Workorder type` · `Workorder date` · `Qty(p)` ·
`Kg(p)` · `Workorder status` · `Weight deviation (%)` ·
`Reported as completed on` · `Company` · `Modified by` · `Order#`

## 🔴 Correction: `Weight deviation` is a **magnitude**, not a signed figure

The section above records the rule as `(Kg(p) − Kg(a)) ÷ Kg(p) × 100`,
*"positive when short"*. **That is wrong on 337 lines**, and the export settles
it:

| Candidate rule | Lines matched |
|---|---|
| `(Kg(p) − Kg(a)) / Kg(p) × 100` | 13 280 / 13 583 |
| `(Kg(a) − Kg(p)) / Kg(p) × 100` | 13 012 / 13 583 |
| **`\|Kg(p) − Kg(a)\| / Kg(p) × 100`** | **13 583 / 13 583** |

> **The numerator takes an absolute value; the denominator does not.**

The clinching row is the single line in the whole export with a **negative**
planned weight — work order `303296/3`, `Picking`, `Kg(p) = −125`,
`Kg(a) = 95` — which prints **`−176`**, not `176`. Only the absolute-numerator
form produces that: `|−125 − 95| ÷ −125 × 100 = −176`. If the whole expression
were wrapped in `abs()`, it would read `176`.

**337 lines came in heavier than planned** and the reference prints every one of
them **positive** (`Picking` lines like `Kg(p) 390 / Kg(a) 1946 → 398,97`). So
the column answers *"by how much did this miss its plan"*, not *"which way"*.

And **zero planned reads `0`, not blank** — all 27 such lines do, including one
that took 46 kg against nothing planned. Arguably that should be unanswerable
rather than on-target, but the screen is what we are matching.

✅ **Fixed** in `helpers.ts` — `weightDeviationPercent` now returns
`Math.abs(kgPlanned - kgActual) / kgPlanned * 100`, and `0` rather than `null`
when nothing was planned. Its return type narrowed from `number | null` to
`number`, so the DTO and the table cell's `—` fallback went with it. The table
now flags **any** deviation red rather than only a shortfall, which is what a
magnitude means.

## The status ladder is three states, not four

| `Workorder status` | Lines |
|---|---|
| `Approved` | **13 305** |
| `Released` | 179 |
| `New` | 126 |

⚠️ Our `workOrderStatuses` is
`["new", "released", "ready", "approved"]`. **`ready` does not appear once in
13 610 lines.** It may be a transient state that never survives to a report, or
it may be invented. Left in place for now: narrowing a `mysqlEnum` is the one
case where drizzle's data-loss warning is real, so it is not worth removing on
absence alone. Recorded in
[PLANNED-CODE-CHANGES.md](PLANNED-CODE-CHANGES.md).

## Seven types, and 1 984 lines have none

| `Workorder type` | Lines |
|---|---|
| `Picking` | 3 936 |
| `Unloading` | 3 179 |
| `Relocating` | 2 405 |
| **‹blank›** | **1 984** |
| `Fetching` | 1 245 |
| `Pick-up` | 860 |
| `Scrapping` | 1 |

The screen is *Warehouse- **and production** workorders*, and `Workorder type` is
a **warehouse** attribute — so the 1 984 blank lines are the production ones.
That is the cleanest available way to tell the two apart in one grid.

`Scrapping` occurs **once** in 13 610 lines, and it is `Released` rather than
`Approved` — a scrapping raised and never carried out.

## ✅ The half-hour release slot, confirmed at scale

`Time period (Time released)` holds **33 distinct half-hour slots**:

| Slot | Lines |
|---|---|
| `14:30 - 15:00` | 1 005 |
| `16:00 - 16:30` | 963 |
| `09:30 - 10:00` | 963 |
| `14:00 - 14:30` | 834 |
| `10:30 - 11:00` | 830 |
| `09:00 - 09:30` | 829 |
| … | … |
| `00:00 - 00:30` | unreleased lines land here |

That confirms the earlier finding that **releasing a work order books it into a
half-hour slot**, and gives the working day: roughly `09:00` to `16:30`, busiest
mid-afternoon. Contrast [trip-data.md](trip-data.md), where trips go into
**whole-hour** slots and 180 of 438 leave at 07:00 — the lorry goes first, the
warehouse works after.

## Three columns that are switched off

- **`Resource` is `-leeg-` on all 13 610 lines.** Nothing is ever assigned to a
  resource. The saved view **`picken`** exists specifically to show a `Resource`
  column that is always empty — and it returns zero rows anyway.
- **`Sawing type`** is blank on 13 576 and reads `Haaks` *(square)* on 34.
- The saved view **`Geteld`** *(counted)* also returns **zero rows** for
  `1-1-2024 … 9-9-2026`.

Same pattern as the empty `Driver`/`Km`/`Cost price` columns on trips and the
`Pickvolgorde` of 0 on all 1 940 locations: the field exists, the practice does
not.

## Every line hangs off an order, and usually a sales order

| `Order#` series | Lines | |
|---|---|---|
| `1xxxxx` | **7 773** | sales order |
| `4xxxxx` | 3 330 | purchase order |
| `2xxxxx` | 62 | return — and 62 is exactly the number of `Return` rows in the receipts export |
| `9xxxxx` | 2 | unexplained |

`Workorder#` is `3xxxxx` on **all 13 610**, confirming the series.

So a warehouse or production work order is raised more often to get metal *out*
than to put it *in* — which matches the stock model, where 1 371 of 2 247 lots
were created by a sales order.
