# Warehouse capacity

`Overviews → Logistics → Warehouse capacity`. Ours: `/warehouse-capacity`.

**How much work is booked into each part of the warehouse, per day.** It counts
**work orders**, not hours and not shelf space.

**Filter**: `Workorder date` from / u/i.

---

## ✅ `Remaining` = `Occupied` − `Ready`

The three number columns are not three independent totals. One row in the sample
proves it, and every other row is consistent with it:

| Date | Section | Subsection | Type | Occupied | Ready | Remaining |
|---|---|---|---|---|---|---|
| 7-1-2025 | 09-OUD/OLD | `9R` | `Picken` | **4** | **1** | **3** |
| 7-1-2025 | 02-OUD/OLD | 02-OUD/OLD | `Picken` | 9 | 9 | 0 |
| 7-1-2025 | Extern-OUD/OLD | `Transporteur` | `Picken` | 3 | 3 | 0 |

Four work orders booked into that subsection that day, of which one is finished
and three are still to be worked.

Which means **the capacity booked for the day is `Occupied` on its own.**

⚠️ Ours computed `totalCapacity = occupied + ready + remaining` and an
`occupiedPercent` off that total. On the `9R` row that gives a total of 8 for
4 work orders — every finished one counted twice and every outstanding one
counted twice. Replaced by `capacityRemaining` in `lib/helpers.ts` and a
`readyPercent` (`ready ÷ occupied`), which is the share that actually means
something: how much of the day's booked work is done.

---

## Booking happens on release

A work order only consumes a slot once it is released, because that is when it
is given a date, a `Warehouse section`, a `Subsection` and a half-hour slot —
see [warehouse-and-production-workorders.md](warehouse-and-production-workorders.md).
`New` work orders carry no section at all, so they cannot be counted here.

---

## 🔑 `Fetching` is subtyped by its destination machine

The `Workorder type` column is in Dutch and reveals something the English
Warehouse workorders screen hides:

| Dutch here | English elsewhere |
|---|---|
| `Picken` | `Picking` |
| `Lossen` | `Unloading` |
| `Afhalen` | `Pick-up` |
| **`Aanhalen Slijpen`** | `Fetching` → grinding |
| **`Aanhalen Knippen`** | `Fetching` → cutting |
| **`Aanhalen UV Folie`** | `Fetching` → UV film |

So capacity is not booked per type but per **type-and-machine**. `Fetching` on
the Warehouse workorders screen collapses three different jobs that compete for
three different resources — and the export confirms it, showing `Fetching` rows
going `To-location` `Slijpen/Foliën`, `Laser 1` and `Knip`.

⚠️ Our `warehouseWorkOrderTypes` has a flat `fetching`. The machine it is
fetching *to* is what decides which capacity pool it draws on, so a capacity
check that ignores it would draw on the wrong pool. Noted in
[IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md).

---

## Sections and subsections

| Section | Subsections seen |
|---|---|
| `00 Hego Almere` | `06` |
| `02-OUD/OLD verwijd...` | itself, `2A`, `2B`, `2C` |
| `03-OUD/OLD verwijd...` | itself |
| `04-OUD/OLD verwijd...` | `4B`, `4E` |
| `05-OUD/OLD verwijd...` | itself |
| `06-OUD/OLD verwijd...` | itself |
| `07-OUD/OLD verwijd...` | itself |
| `08-OUD/OLD verwijd...` | itself |
| `09-OUD/OLD verwijd...` | `9R` |
| `Intern-OUD/OLD ver...` | itself |
| `Productie-OUD/OLD v...` | itself |
| `Extern-OUD/OLD ver...` | **`Transporteur`** |

`verwijderen` is Dutch for "to be deleted", so every `-OUD/OLD verwijd...`
section is a decommissioned one still carrying history. Only `00 Hego Almere`
is current.

`Extern-OUD/OLD` with a subsection of `Transporteur` is the interesting one: the
carrier's own yard is modelled as a warehouse section. Goods sitting on a lorry
have a location.

⚠️ **`Section` is a level above location, and we do not model it.** Still open —
see [warehouse-workorders.md](warehouse-workorders.md) open question 3.

---

## Columns

`Date` · `Warehouse section` · `Subsection` · `Workorder type` · `Occupied` ·
`Ready` · `Remaining`
