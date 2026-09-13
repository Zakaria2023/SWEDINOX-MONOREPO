# Deliveries — the line between the order and the lorry

**Item B5 of [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md), captured 13-9-2026.**
`Overviews → Sales → Deliveries`, `View` = `-empty-`. **54 columns, 6 134 rows**
— `exports/b5-deliveries.tsv`.

One row per **delivery line**: 1 986 orders, more rows than the 4 975 order
lines, because a line delivered in parts appears once per part.

This is the screen the rebuild most needed. It carries the blocking flags, the
planned-vs-actual quantities, the trip, the work orders and the invoice number
— the whole chain from *ordered* to *paid* on one row.

---

## 1. 🔴 Three blocking flags live **on the delivery line**

| Flag | True |
| --- | --- |
| `Transport blockage` | 895 |
| `Financially blocked` | 96 |
| `Commercial blocked` | 18 |

They are close to mutually exclusive — only 4 rows of 6 134 carry two at once,
and none carries three.

**A transport-blocked line cannot be put on a trip.** The rule is exact:

| | has a `Trip number` | no trip |
| --- | --- | --- |
| `Transport blockage = False` | **4 297** | 942 |
| `Transport blockage = True` | **0** | **895** |

Zero exceptions in 6 134 rows. This is the other half of the blocking model —
[credit-and-blocking.md](credit-and-blocking.md) proved *why* an order is
blocked; this proves *what the block stops*.

---

## 2. 🔴 `Blocking reason` — eight values, and they are about **supply**

| Reason | Rows |
| --- | --- |
| Purchased materials have not yet been received | 267 |
| `APP` isn't carried or carried incompletely | 46 |
| Wait for call | 41 |
| Purchasing is arranged via Task | 11 |
| Reservation by easy2optimize | 11 |
| Purchase operations have not yet been received | 2 |
| Purchasing operations are controlled via Task | 2 |
| Internal production | 2 |

382 rows of 6 134 carry one. Note what is **not** here: no credit reason, no
commercial reason. 327 of the 382 sit on a row with **no flag set at all**, and
41 of the 96 financially-blocked rows carry **no reason**. So the free-text
reason explains the *supply* hold, and the three booleans are separate gates —
they are not a reason/flag pair.

`easy2optimize` and `Task` are named modules of the reference, not concepts of
ours. They are why a reservation or a purchase exists; we do not need to
reproduce them, only to allow a hold whose reason is a sentence.

---

## 3. 🔴 Everything is **planned vs actual**, and the ladder has three rungs

| Planned | Actual |
| --- | --- |
| `Line Qty(p)` | `Line Qty(a)` |
| `Delivery date (p)` | `Delivery date (a)` |
| `Kg(p)` | `Kg(a)` |

and on top of that a three-stage quantity:

```
Planned Delivery  ≥  Ready  ≥  Delivered
```

which holds on **6 097** and **6 127** of 6 134 rows respectively.

`Delivered = 0` on 965 rows, `Kg(a) = 0` on 788, `Delivery date (a) = 0` on 809
— nothing has left yet. **The actual columns are zero, not null**, which is the
same sentinel habit as `999999` for a coil's length.

---

## 4. 🔴 `Delivery status` is a **second, different** ladder

Nine values, and they are **not** the line-status list:

| `Delivery status` | Rows |
| --- | --- |
| Invoiced | 5 156 |
| Released | 362 |
| **Ready** | 189 |
| In progress | 113 |
| Expired | 111 |
| Partially delivered | 65 |
| Completed | 58 |
| **New** | 41 |
| **Workorders created** | 39 |

`Ready`, `New` and `Workorders created` exist nowhere else. Our
`deliveryStatuses` holds four values (`not_ready`, `ready`, `released`,
`delivered`) — `ready` and `released` are right, the other two are not in the
reference at all, and five states are missing.

The two ladders move together but not in lockstep: `In progress` on the line
pairs with `Ready` **178** times and with `In progress` **113** times, and 32
`Invoiced` lines sit on an `Expired` delivery.

⚠️ **`Expired` appears as a `Line status` here (70 rows)** but never in
[order-lines.md](order-lines.md). Another state the `Order lines` screen hides —
the same behaviour as status `830`
([sales-options-and-calloff.md](sales-options-and-calloff.md) §5).

---

## 5. `Transport status` — a **third** ladder, six values

`Completed` 4 345, `New` 207, `Loading list` 56, `Loading done` 45, `Loaded` 17,
`Scheduled` 1, and blank on 1 463 — exactly the rows with no trip.

So a delivery line carries **three independent statuses**: where the line is
(`Line status`), where the goods are (`Delivery status`), and where the lorry is
(`Transport status`). We model one.

---

## 6. 🔴 `Theor. Weight U. = M3` means the figure is a **density**

| `Theor. Weight U.` | value | rows | what it is |
| --- | --- | --- | --- |
| `M3` | 7850 | 5 266 | steel, kg/m³ |
| `M3` | 8000 | 339 | stainless, kg/m³ |
| `M3` | 2755 | 338 | aluminium alloy, kg/m³ |
| `M3` | 2700 | 80 | aluminium, kg/m³ |
| `M1` | 0.967, 1.52, 3.2, … | 111 | kg per metre |

6 023 of 6 134 rows are `M3`. **This is the fourth confirmation of the standing
rule**: a theoretical weight in `M3` is a density, not a weight, and backfilling
`weight_unit` to `M3` would silently turn every per-piece kilo into a kg/m³
figure. The warning stays.

---

## 7. What it links to

- **`Trip number`** — 378 trips in the `600xxx` series, `Vehicle` 17 values
  (`ADO NL` 2 447, `AFHAAL` 434 — *afhaal* is a customer pick-up, matching
  `Pick-up = True` on 881 rows). Joins straight onto
  [trip-data.md](trip-data.md).
- **`Last Wrs. Wo.` / `Last Prod. Wo.`** — warehouse and production work orders
  in the `30xxxx` series, `0` on 1 066 and 4 170 rows. Joins onto
  [warehouse-and-production-workorders.md](warehouse-and-production-workorders.md).
- **`Invoice no.`** — the `500xxx` series. `0` on 977 rows, and **all 977 are
  in a not-yet-invoiced status**. A delivery line carries its invoice number
  directly; there is no separate join table.
- **`Invoiced (Prod.)` / `Invoiced (Opt.)`** — the invoiced amount split into
  metal and processing, matching the same split on the invoice line
  ([invoice-lines.md](invoice-lines.md) §3).
- **`All options`** — the Dutch display string again, with grades this time:
  `Slijpen (K320), Laser Folie`. **`K320` is a grinding grit** and appears
  nowhere in the option catalogue, so an option carries a parameter.

---

## 8. Switched off — constant on all 6 134 rows

`Bls`, `Bls+P`, `Sawing`, `Sawing type`, `L.Saw angle`, `R.Saw angle`,
`Machine`, `Drilling`, `Drilling holes`.

The whole **sawing and drilling** apparatus — angles, machine assignment, hole
counts — exists and has never been used on a delivery. Same evidential weight as
the header's seven blank columns: the feature is off, not absent.

---

## 8b. `Stock product adjusted` is a **date**, not a flag

44 distinct values, all dates. **2024-01-01 on 4 492 of 6 134 rows** — a
migration stamp, the day the catalogue was loaded — then 2024-12-31 (610),
2024-12-23 (332) and a long tail. The name reads like a boolean and the column
is a timestamp of when the product's stock flag was last changed.

---

## 9. Audit columns, at last

`Modified on` (6 045 distinct timestamps) and `Modified by` (17 users, by first
name: `FURKAN` 3 072, `ANDRE` 828, `RICHARD` 790, `FARIEL` 721, …), blank on 9.

This is the first export that shows the reference keeps a per-row audit trail.
Our schema stores `modifiedByUserId` as a Clerk id on some tables; this says the
reference does it on delivery lines too, and that the user list on the shop
floor is bigger than the six sellers the header knows about.
