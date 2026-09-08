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

**Proved on a 3 087-row export: exact on every single row.** Nearly all of them
read `n/n/0` — the day's work was finished — with 51 rows of `1/0/1` and a long
tail of partly-done sections.

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

## 🔑 `Fetching` is ten jobs, not one

The `Workorder type` column is in Dutch here, and it reveals what the English
Warehouse workorders screen hides. The export carries **fifteen** distinct types, not the six the Warehouse
workorders screen shows — because `Aanhalen` (Fetching) is really **ten**
separate jobs:

| Type | Rows | English |
|---|---|---|
| `Picken` | 1 286 | Picking |
| `Lossen` | 444 | Unloading |
| `Verplaatsen` | 406 | Relocating |
| **`Aanhalen Laser`** | **284** | Fetching → laser |
| **`Aanhalen Slijpen`** | **266** | Fetching → grinding |
| **`Aanhalen Laser Folie`** | **152** | Fetching → laser, filmed |
| `Afhalen` | 95 | Pick-up |
| **`Aanhalen Knippen`** | **56** | Fetching → cutting |
| **`Aanhalen Borstelen`** | **32** | Fetching → brushing |
| **`Aanhalen UV Folie`** | **25** | Fetching → UV film |
| **`Aanhalen Blauwe Folie`** | **23** | Fetching → blue film |
| **`Aanhalen Decoilen`** | **11** | Fetching → decoiling |
| **`Aanhalen Folie verwijderen`** | **4** | Fetching → film removal |
| **`Aanhalen Duplo`** | **2** | Fetching → duplex |
| `Verschrotten` | 1 | Scrapping |

So capacity is not booked per type but per **type-and-treatment**, and the ten
`Aanhalen` variants line up one-for-one with the processing options bought as
service lines on a purchase order — Slijpen, Decoilen, Blue Foil, UV Foil,
Borstelen. The same list, seen from the warehouse rather than from the invoice.

⚠️ Our `warehouseWorkOrderTypes` has a flat `fetching`. What it is fetching
*for* is what decides which capacity pool it draws on, so a capacity check that
ignores it draws on the wrong pool — and there are ten pools, not three. Noted
in [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md).

---

## Sections and subsections

The export carries **17 warehouse sections and 48 subsections**, against the
twelve and fourteen visible on screen.

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
