# Reservations

`Overviews → Logistics → Reservations`, captured 10-9-2026.

Two screens I had already built pointed straight at this one — `Blocked
deliveries` and `Deliveries to be arranged **without stock reservation**` — and
I had never seen it. Our `reservations/` route was written blind from the menu
name.

## The screen is a stock grid; the reservation is behind a right-click

The overview itself lists **stock rows**: `Product code`, `Product`, `Stock
product`, `Standard product`, `Length`, `Section`, `Location`, `Location type`,
`Qty.`, `U.` — the same shape as `Stock on location`.

The reservations are one level down, behind **right-click → `Toon
reserveringen…`**. That is the third screen where the answer hides behind an
untranslated Dutch `Toon …` verb, after `Toon locatie` on Locations. **In this
system the grid is not the whole screen.**

## What a reservation is

```
Reservations Laad Aluminium plate semi-rigid 1S (Al 99.5)
  Order  Delete

  Type  Status      Quantity  Unit  Order/line   Company             Date        Changed
  Sale  Definitive        64  ST    O100742/50   Holland Dak Acces…  1-12-2025
```

**A reservation binds a specific physical lot, not a quantity of a product.**
That was the question this screen was opened to answer, and three things settle
it:

1. The panel is titled with the **location** as well as the article —
   _"Reservations **Laad** Aluminium plate semi-rigid 1S"_.
2. The same product at a different location opens an **empty** panel
   — _"Reservations **7A** Cold-rolled plate 316L"_, no rows.
3. It reconciles exactly against the order's own Stock panel: of the thirteen
   lots of product 6010015315, only the one standing at `Laad` reads
   `Reserved 64 ST · Kg Reserved 1.190 · Available 0`. The other twelve are
   `Reserved 0` and fully available.

So `Reserved` on a lot is not a statistic. It is the sum of the rows in this
panel.

The panel is a **list**, which means one lot can be spoken for by several order
lines at once — the reason this had to become a table here and could not stay a
number on the lot.

| Column              | What it is                                                             |
| ------------------- | ---------------------------------------------------------------------- |
| `Type`              | `Sale` — **and `Purchase`**, see below                                 |
| `Status`            | `Definitive`, `Provisional` or `Temporary`                             |
| `Quantity` / `Unit` | `64 ST` — the lot's own unit, and the same reservation weighs 1.190 Kg |
| `Order/line`        | `O100742/50` — order 100742, **line 50**                               |
| `Company`           | the customer on that order                                             |
| `Date`              | `1-12-2025`, the line's delivery date                                  |
| `Changed`           | blank on the row seen — an audit stamp                                 |

The toolbar offers **`Order`** and **`Delete`** and nothing else. A reservation
is not edited: it is followed to its order, or dropped.

## 🔴 It corrected a rule we had invented

Our `getReservationRecords` derived the type as _"**Definitive** once invoiced,
otherwise **Temporary**"_. That is wrong.

Order 100742's line 50 has status **`In progress`** — released, not invoiced,
not delivered — and its reservation reads **`Definitive`**. A reservation is
definitive from the moment the order is placed. Invoicing has nothing to do with
it.

We were also squashing two of the reference's columns, `Type` and `Status`, into
one string that read `"Definitive (Sales)"`. They are now two columns here as
well.

## What was built

`Reservations`, a real table: the lot, the order line, `type`, `status`,
`quantity` + `unit` + `quantity_kg`, `reserved_for` (the delivery date) and
`changed_at`.

Rows are written where the reservation is actually made — the order confirm path
that was already incrementing `Stock.reservedQuantity` — and deleted where the
claim ends: on delivery, and on cancellation. `Stock.reservedQuantity` stays as
the running total, because that is what the reference shows on the lot.

Both enums started with **only the value the single popup row showed** — `type`
`('sale')`, `status` `('definitive')` — on the reasoning that a `mysqlEnum`
widens for free and a guess does not.

## 🔴 The 435-row export then widened both, and the guess would have been wrong

The screen's own export arrived the same day. Its `Reservation type` column is a
**cross product** of the two:

```
Definitive (Sales)   342      Provisional (Sales)    65      Temporary (Sales)    4
Definitive (Purchase) 21      Provisional (Purchase)  1      Temporary (Purchase) 1
Definitive (Scrap)     1
```

⚠️ **Seven values, not six.** The first read of this file used
`most_common(6)` and silently cut the seventh off the bottom. `Scrap` is a
single row — two plates on a `Pick` face with no order behind them, waiting to
be written off — and a truncated frequency list is exactly how you lose the rare
member that changes the model.

### `Purchase` is external processing

15 of the 23 stand at a **`Bewerker`** location and the company is the
processor — Metalfinish Group, Decomecc, Demar Laser, Hego Production. The other
8 sit on ordinary `Pick` faces.

So: material goes out to be ground, foiled, slit or lasered, and the purchase
order for that work holds it. **Coils and plates alike** — 13 coils against 10
plates. (An earlier version of this page said "every one is a coil", which was
true of the first twelve rows sorted by product code and of nothing else.) The same flow the `Control Stock increase due to external processing`
screen posts to **GLA 3100** with Hego Production on 455 of 483 rows.

The guess, had one been made, would have been _production_ — a cut reserving its
own material. That is not what the second value turned out to be.

### The status is a progression, not a label

```
Temporary     5   `Order` reads **0** on every one: a hold with no document
Provisional  66   a real order, but 64 of the 66 still at a `Pick` location
Definitive  364   169 of them at `Laad`, staged for a truck
```

A reservation starts as somebody holding metal by hand, becomes provisional when
an order exists, and definitive once the goods are committed and moving.

### And it forced two schema changes

- **`orderItemUuid` is now nullable**, for two independent reasons: a purchase
  reservation points at a purchase line instead, and a `Temporary` one points at
  nothing at all.
- **`purchaseOrderItemUuid` added** beside it. The cause of a reservation is
  polymorphic, exactly like the cause of a stock movement in
  [stock-mutations.md](stock-mutations.md).

### What it confirmed

**One lot really can be held by several lines.** 78 of the 226 distinct
(product, location) pairs carry more than one reservation, and the busiest holds
**twelve**. A number on the lot could never have expressed that, which was the
reason for building the table before this export existed.
