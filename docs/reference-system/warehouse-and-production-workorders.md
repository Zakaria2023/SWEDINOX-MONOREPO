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
| **`Weight deviation`** | **here** | `(Kg(p) − Kg(a)) ÷ Kg(p) × 100` | **positive** |

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
