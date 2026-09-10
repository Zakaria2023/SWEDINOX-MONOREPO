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
   *"Reservations **Laad** Aluminium plate semi-rigid 1S"*.
2. The same product at a different location opens an **empty** panel
   — *"Reservations **7A** Cold-rolled plate 316L"*, no rows.
3. It reconciles exactly against the order's own Stock panel: of the thirteen
   lots of product 6010015315, only the one standing at `Laad` reads
   `Reserved 64 ST · Kg Reserved 1.190 · Available 0`. The other twelve are
   `Reserved 0` and fully available.

So `Reserved` on a lot is not a statistic. It is the sum of the rows in this
panel.

The panel is a **list**, which means one lot can be spoken for by several order
lines at once — the reason this had to become a table here and could not stay a
number on the lot.

| Column | What it is |
| ------ | ---------- |
| `Type` | `Sale`. The column's existence says it expects others; a cut reserving its material is the obvious candidate, but it has not been seen |
| `Status` | `Definitive` |
| `Quantity` / `Unit` | `64 ST` — the lot's own unit, and the same reservation weighs 1.190 Kg |
| `Order/line` | `O100742/50` — order 100742, **line 50** |
| `Company` | the customer on that order |
| `Date` | `1-12-2025`, the line's delivery date |
| `Changed` | blank on the row seen — an audit stamp |

The toolbar offers **`Order`** and **`Delete`** and nothing else. A reservation
is not edited: it is followed to its order, or dropped.

## 🔴 It corrected a rule we had invented

Our `getReservationRecords` derived the type as *"**Definitive** once invoiced,
otherwise **Temporary**"*. That is wrong.

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

Both enums carry **only the values the reference has been seen to write**. A
`mysqlEnum` widens for free and inventing a member that turns out to be spelled
differently does not, so `type` is `('sale')` and `status` is `('definitive')`
until something proves otherwise.
