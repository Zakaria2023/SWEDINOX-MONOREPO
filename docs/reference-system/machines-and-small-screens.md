# Machines, and the two small delivery screens

Three screens that are answered completely and need nothing further.

---

# Machines

`Overviews → Logistics → Machines`. Ours: `/machines`.

**Two columns, six rows. That is the whole table.**

| Machine code | Machine |
|---|---|
| `DECOILER` | Decoiler |
| `INTERNE WZH` | Interne wzh |
| `KNIP` | Knip |
| `LASER 1` | Laser 1 |
| `LASER 2` | Laser 2 |
| `SLIJPEN` | Slijpen/Foliën |

No capacity, no rate, no cost per hour — the overview carries nothing but
identity. Which answers the question asked in
[NEXT-LOGISTICS.md](NEXT-LOGISTICS.md) item 15: **a machine does not carry a
rate.** Capacity is planned by the half-hour slot on the work order, not by a
figure on the machine.

### These six are the same six seen from three other angles

| Machine | Turns up as |
|---|---|
| `SLIJPEN` | `Fetching` → `Slijpen/Foliën` on Warehouse workorders; `Aanhalen Slijpen` on Warehouse capacity; the `Slijpen (K320)` purchase option |
| `KNIP` | `Fetching` → `Knip`; `Aanhalen Knippen`; the `KNIP` sawing machine on Nesting |
| `LASER 1` / `LASER 2` | `Fetching` → `Laser 1`; `LASER 1` on Nesting |
| `DECOILER` | the destination of a decoiling work order; the `Decoilen` purchase option, priced per tonne |
| `INTERNE WZH` | *(werkzaamheden — internal work)* the catch-all |

So a processing option bought on a purchase line, a `Fetching` work order, a
capacity pool and a nesting machine are four views of one machine. Our
`MACHINE_OPTION_FOR_PROCESSING` map already links options to machines; what it
does not yet know is that the same machine name is the work order's
`To-location`.

⚠️ There is **no `UV Folie` machine**, yet Warehouse capacity books
`Aanhalen UV Folie`. Either UV film runs on `SLIJPEN` (whose name,
`Slijpen/Foliën`, does say "grinding/film") or it is a capacity pool with no
machine behind it. The name strongly suggests the former.

---

# Deliveries to be arranged without stock reservation

`Overviews → Logistics → Deliveries to be arranged without stock reservation`.
Ours: `/deliveries-to-arrange`.

**Sales order lines with a delivery date and nothing reserved to fill it.** A
worklist, not a report: every row is a promise that cannot currently be kept.

Twelve rows across five customers. All `PC304200` / `PC304300` / `PC304150`
cold-rolled 304 plate, quantities of 5 to 1 000, dated `17-9-2025` to
`13-10-2025`.

**Columns**: `Customer` · `Order` · `Line` · `Delivery date` · `Qty(p)` ·
`U(p)` · `Product code` · `Product description` · `Length`

Nine columns, no money, no status. Ours reads
`WHERE OrderItems.qtyReserved = 0`, which matches.

⚠️ One gap: the reference sorts by `Customer` and ours by `createdAt DESC`. A
worklist is worked customer by customer, so the sort is part of the screen.

## ✅ Re-captured 9-9-2026 — the nine columns confirmed, and the sort fix verified

A second screenshot of the same screen confirms the column list exactly, with the
sort marker sitting on **`Customer`**. Our
`getDeliveriesToArrange` now reads
`.orderBy(asc(Companies.companyName), asc(OrderItems.deliveryDate))`, so that
gap is closed.

**11 rows across 4 customers** this time (AVK Nederland ×4, Graviers GmbH ×1,
H. Schrijver ×2, Van Osch ×4) against the *"twelve rows across five customers"*
recorded above. A worklist shrinks as work is done, so both readings can be
true — but the earlier count is the less reliable of the two.

Three things the first capture did not show:

**There are no saved views and no filter.** The `View` box is empty — not
`-empty-`, actually blank — and `Translate View…` is greyed out. The `from` /
`u/i` boxes are empty with no filter label beside them, and the grid still
returns rows.

> ⚠️ A standing rule elsewhere in these notes is *"never leave a date filter's
> `from` box blank — it voids the filter and returns nothing."* **This screen is
> the exception**: it has no date filter at all, because a worklist is never
> scoped to a period. Every row is outstanding by definition.

**The toolbar says how the screen is meant to be worked:**

`Show Product` · `Show Order` │ **`Purchase lines`** · **`Warehouse workorders`**
· `Orders and Quotes`

So the answer to *"why is there nothing reserved for this line?"* is one click
away in two directions — **`Purchase lines`** (is the metal on order?) and
**`Warehouse workorders`** (is it already being fetched?). Ours offers neither
jump, and they are the whole point of a worklist.

**The rows are eleven months stale.** Delivery dates run `17-9-2025` to
`13-10-2025` against a system date of `9-9-2026`. That fits the density cliff
recorded in [trip-data.md](trip-data.md) — the reference database holds about
five live months of trading — so this is an uncleared queue in a snapshot, not a
live backlog. 🚩 Do not read the row count as a workload.

### A plausible reading of the product codes

Every row describes as `Cold-rolled plate 304`, across five different codes:

| Code | `Length` on the line |
|---|---|
| `PC304150` | 650 |
| `PC304200` | 250 · 200 · 150 · 350 · 300 |
| `PC304300` | 200 · 750 |
| `PC304400` | 450 |
| `PK30420025125` | 2500 |

The `PC…` codes take a **different length on every line** while the `PK…` code's
length (2500) is the `25` inside its own code. Reading `PC304200` as *2,00 mm
cold-rolled 304* and `PK30420025125` as *2,00 mm, 2500 × 1250*, that would make
**`PC` a cut piece sized per line and `PK` a stock plate sized in its code** —
which is consistent with the group/product split in
[product-detail.md](product-detail.md), where the description belongs to the
group and the dimensions to the product.

⚠️ Plausible, not proved. It rests on five codes from one screenshot; a product
overview filtered to `PC304*` and `PK304*` would settle it.

---

# Blocked deliveries

See [blocked-deliveries.md](blocked-deliveries.md) — it earned its own file,
because it proved the sales-side pricing rule to the cent.

---

# Machines — answered 9-9-2026: there is no detail screen

**`Machines` is a flat, read-only list. Nothing on it can be opened** — no
double-click, no detail form, no action in the overview. Asked for three rounds
and the answer is that the screen does not exist.

Together with [locations.md](locations.md) that settles the model:

> **A machine is a production location, not an entity of its own.**

`Decoiler`, `Laser`, `Laser 1`, `Laser 2` and `Knip` are all **locations** under
the `Productie` section, each with an `Opslag …` *(storage)* sibling
(`Opslag Laser 1`, `Opslag Knip`, `Opslag Slijpen`, `Opslag Decoilen`). A
warehouse work order's `To-location` of `Decoiler` therefore names a *place*, and
the machine is that place.

So there is **no rate and no capacity on a machine**, because there is no machine
record to hang them on — consistent with this screen showing six machines and no
rate on any of them. Capacity is booked against the *location*, which is what
[warehouse-capacity.md](warehouse-capacity.md) measures.

⚠️ **Consequence for follow-up 5** (`Fetching` subtyped by machine): the subtype
is a **destination location**, not a machine foreign key. Ten `Aanhalen`
variants, ten `Productie` locations.

---

# Deviations in count lists

`Overviews → Logistics → Deviations in count lists`. The **first** item in the
Logistics menu, and one we have not built at all.

**Zero rows** for `1-1-2024 … 9-9-2026`, in both the saved view `Afwijkingen`
*(deviations)* and in `-empty-`. So the columns below are all this screen can
currently give.

**Columns** (22, from `-empty-`): `Workorder date` · **`Booked by`** ·
`Location` · `Product` · `Length (mm)` · `Qty.` · `U.` · `Kg.` ·
**`Amount`** · **`Document`** · **`Old stk.`** · **`Old stk. Kg.`** ·
**`New stk.`** · **`New stk. Kg.`** · `Date reported as completed` · `FSP` ·
`FSP U.` · `Main group` · `Subgroup` · `Revenue group` ·
`Stk-general ledger account no` · `Stk-general ledger account`

## What the columns say it is

`Old stk.` / `Old stk. Kg.` → `New stk.` / `New stk. Kg.`, with an **`Amount`**
beside them and a **`Booked by`** and a **`Document`**: this is the
**stock-count correction** screen. Somebody walks the racks, the count disagrees
with the book, and the difference is booked with a value and an audit trail.

That connects to two mutation reasons from
[stock-mutations.md](stock-mutations.md) — `Correctie Stock difference` (87
rows) and `Correctie Inventory rejection` (3) — both of which carry **no work
order**, because a human does them. It also matches our existing
`count_correction` movement reason, which until now had nothing behind it.

The general-ledger pair (`Stk-general ledger account no` / `…account`) is the
same `3000 / Stock` seen on every lot and every mutation, so a count difference
posts to the stock account like any other movement.

## 🔴 Why it is probably empty, and it is not "no deviations"

The screen carries **two** date filters, both defaulted to `1-1-2024 … 9-9-2026`:

| Filter |
|---|
| `Workorder date` |
| `Date reported as completed` |

A count work order that was raised but **never reported as completed** has no
value in the second column, so the `AND` between the two filters excludes it —
the same trap as the blank `from` box, arriving from the other direction. Given
the mutations export *does* contain 90 correction rows in this period, "zero
deviations" is the less likely reading.

→ **To settle it:** clear the `Date reported as completed` filter (or widen it
to `1-1-2000`) and press `Show Data` again.

## Unknown

**`FSP` / `FSP U.`** — a value and its unit, sitting between `Amount` and the
grouping columns. Position suggests a valuation price, and the Dutch accounting
term *fictieve standaardprijs* would fit the initials, but nothing here proves
it. **Not guessed at in code.**

## Toolbar

`Save as Excel` · `Show in Excel` · `Print` · `Show Product` *(greyed)* │
`Purchase lines` · `Warehouse workorders` · `Orders and Quotes` ·
`Production workorders`

`Show Product` greys out with no row selected, as elsewhere.
---

# Pick statistic

`Overviews → Logistics → Pick statistic`. Not built, and we have nothing like
it.

**9-9-2026 export**: `exports/pick-statistic.tsv`, **1 332 rows × 11 columns**,
covering **564 products**, **5 010 picks** and **4 758 786 kg**.

**Grain: one row per product per month.** `201003315` has five rows for 2025,
one for each of January to May. A histogram, not a transaction list.

**Filters**: `Date reported as completed` (`1-1-2024 … 9-9-2026`) and
`Product code` (blank → `zzzzzzzzzzzzzz`, the text-filter sentinel).
**No saved views** — the `View` box is blank and `Translate View…` is greyed.

**Columns**: `Product code` · `Description` · `Year (Date completed)` ·
`Month (Date completed)` · **`Picks`** · **`Qty. Picked / Fetched`** · `U.` ·
**`Kg. Picked`** · `Avg. Qty. per pick` · `Avg. Kg. per pick` ·
**`Stock product`**

## What it measures: trips to the rack, not tonnage

`Picks` is **how many times somebody walked to the shelf**; `Qty. Picked /
Fetched` is how much came off it. The gap between the two is the point —
handling cost lives in the number of visits, not the weight.

| Product | Picks | Qty | Kg | Kg/pick |
|---|---|---|---|---|
| `PK304L200315` | **189** | 2 653 | 187 276 | 991 |
| `PK304L150315` | 149 | 2 712 | 144 753 | 971 |
| `PK30415025125` | 130 | 2 184 | 81 546 | 627 |
| `PK304150315` | 130 | 1 975 | 105 976 | 815 |
| `PK304200315` | 104 | 1 392 | 99 874 | 960 |

Every one of the busiest is cold-rolled 304 / 304L plate. The highest single
product-month figure is **62 picks**.

The title `Picked / Fetched` ties it to the `Picking` (3 936) and `Fetching`
(1 245) work order types in
[warehouse-and-production-workorders.md](warehouse-and-production-workorders.md).

## Both averages are the exact quotient — nothing is rounded

| Column | Rule | Exact on |
|---|---|---|
| `Avg. Qty. per pick` | `Qty. Picked / Fetched` ÷ `Picks` | **1 332 / 1 332** |
| `Avg. Kg. per pick` | `Kg. Picked` ÷ `Picks` | **1 332 / 1 332** |

The stored value carries full precision and only the **screen** rounds — which
is why `Kg 87 / 2 picks` displays `44` while the export holds `43.5`.

⚠️ From the screenshots alone I had written that these round half-up. **They do
not.** 211 rows first looked non-exact and every one was Excel's
15-significant-digit noise (`800.130434782609` against `800.1304347826087`).

## `Stock product` — and a guess of mine the export killed

| | Rows |
|---|---|
| `True` | 1 248 |
| `False` | **84** (63 distinct products) |

From the `Deliveries to be arranged` screen I had guessed that a **bare** code is
a non-stock group and a dimensioned code is the stock product. **The export says
no.** Only 2 of the 84 `False` rows carry a bare six-digit code; the other 82
have full codes and are overwhelmingly **tube and pipe**:

```
562906004        Stainless steel 316 slit flat
5812021302/06    Stainless steel 304 tube round, welded
58120424025/00   Stainless steel 304 tube round, welded
581604002/06     Stainless steel 304 welded pipe, din
```

So `Stock product = False` means **this article is not stocked** — bought or made
to order — and has nothing to do with the shape of its code. **Plate is stocked;
tube is not.** That is a business fact worth more than the guess it replaced.

## Two smaller notes

- **`Description` is blank on 56 rows across 28 product codes**, and those 28 are
  exactly the numeric aluminium range (`2009100`, `201003315`, `20100425125`).
  That missing description is what made `2009100` look like an internal id rather
  than a product — see [receipt-chain.md](receipt-chain.md).
- **`U.`**: `ST` 1 315, `M1` 14, `KG` 3.

## The date cliff again — but this one reaches the present

| | Rows |
|---|---|
| 2025-01 … 2025-05 | **1 260** |
| 2025-06 … 2026-09 | 72 |

The same shape as every other export. But unlike trips, this screen **does**
reach today: 2026-08 has 1 row and **2026-09 has 6**. So the reference system is
still lightly used; it is the five months to May 2025 that hold the real trading.
