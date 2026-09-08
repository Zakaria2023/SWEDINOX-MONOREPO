# What I need from the Logistics group

Same shape as the Purchase list: open the screen, do the thing, send the
picture with its number.

**Start with 1 and 2.** Everything after them is ordinary column-capture and
can be done in any order, or not at all until we build that screen.

---

# ✅ 1 and 2 are done

**The menu**, in its own order:

Deviations in count lists · Products · Warehouse- and production workorders ·
**Receipts** · **Warehouse workorders** · Production workorders ·
Production batches · Transport workorders · **Trip data** · **Reservations** ·
Stock · Stock on location · Klant voorraad op locatie · Locaties ·
Stock history · Stock mutations · **Freight movement** ·
**Revenue per product** · Freight flow (SFN) · Pick statistic · Machines ·
Blocked deliveries · Deliveries to be arranged without stock reservation ·
Sawing layouts · Warehouse capacity · Production capacity ·
Production capacity details · Capacity checks · Time registration ·
(Re)optimize · Nesten · Transport status adjustments

Five I had not guessed: **Receipts**, **Trip data**, **Reservations**,
**Freight movement** and **Revenue per product**. `Receipts` is the one to
look at next — see item 3.

**Warehouse work orders** gave an 11 625-row export and
[answered how goods are received](warehouse-workorders.md): approving a work
order of type `Unloading`. Nothing further is needed from it.

---

# ✅ Everything asked for has arrived

On **8-9-2026** the whole group came in one batch: Receipts, Stock mutations,
Warehouse- and production workorders, Warehouse capacity, Blocked deliveries,
Deliveries to be arranged, Transport status adjustments, Nesting and Machines —
plus the Customers, Companies and Finance menus.

**What it settled**, each with its own file:

| Screen | What it proved |
|---|---|
| [Receipts](receipts.md) | the six-state receipt ladder, and that `Material still to be invoiced` is money |
| [Blocked deliveries](blocked-deliveries.md) | **sales amount = Kg(p) × price in the price's own unit** — the same six-place bug as purchase |
| [Nesting](nesting.md) | `Theor. Weight` is a **density** when its unit says `M3` |
| [Warehouse- and production workorders](warehouse-and-production-workorders.md) | `Weight deviation` is a percentage; releasing books a half-hour slot |
| [Warehouse capacity](warehouse-capacity.md) | `Remaining = Occupied − Ready`; `Fetching` is subtyped by machine |
| [Transport status adjustments](transport-status-adjustments.md) | the **seven**-state trip ladder |
| [Stock mutations](stock-mutations.md) | every movement names the work order that caused it |
| [Machines](machines-and-small-screens.md) | six machines, and **no rate on any of them** |

All of it is built and checked — `pnpm verify-logistics`, 64 cases against the
figures those screens printed.

## ~~3.~~ `Receipts` — the screen I did not know existed

It sits directly above `Warehouse workorders` in the menu, and the purchase
order's own panel is called `Receipts` too. If a reception and an `Unloading`
work order are the same thing seen twice, this is where that shows.

1. `Overviews → Logistics → Receipts`
2. `View` = **`-empty-`**, dates from `1-1-2024`, `Show Data`

📸 The grid.

Then press **`Show in Excel`** and tell me — an export beats any screenshot.

**What I am after:** whether a receipt row carries a work order number, and
whether its `Kg(a)` matches the work order's.

## ~~2.~~ Warehouse work orders — the screen that finishes Purchase

This is the one that matters. Everything in the purchase chain now hangs on how
goods actually get booked into stock, and this is where that happens.

1. `Overviews → Logistics → Warehouse workorders`
2. Set the date filter wide — from `1-1-2024`
3. Set `View` to **`-empty-`** so no columns are hidden
4. `Show Data`

📸 **(a)** The grid with its columns.

5. Find a work order whose status is **not** finished — anything reading `New`,
   `Released` or `In progress`
6. Expand it down to a line

📸 **(b)** The line, and the detail panel underneath it if there is one.

7. Look at the toolbar and screenshot it

📸 **(c)** The toolbar — I want the action buttons, the way `Make final`,
`Confirm` and `Split` turned out to matter on the purchase order.

**What I am trying to learn:** does a warehouse work order have a *from* and a
*to* location, does completing one move stock, and is there a work order type
that means "goods in".

---

# 🟠 Then — the rest of the group

For each screen: `View` = **`-empty-`**, a wide date filter, `Show Data`.

📸 The grid. If it has data, also press **`Show in Excel`** and tell me — I read
it straight out of the running Excel and that is worth more than any
screenshot.

| # | Screen |
|---|---|
| 3 | Stock (the main one, if it differs from Stock on location) |
| 4 | Stock history |
| 5 | Stock mutations |
| 6 | Locations |
| 7 | Blocked deliveries |
| 8 | Deliveries to be arranged without stock reservation |
| 9 | Freight flow (SFN) |
| 10 | Pick statistic |
| 11 | Machines |
| 12 | Warehouse capacity |
| 13 | Transport status adjustments |

If a screen is not in your Logistics menu, skip it and say so — I am working
from a tree glimpsed in an earlier screenshot, not from the menu itself, which
is why item 1 comes first.

---

# 🟡 Two things to open, whatever the menu holds

## 14. A stock movement, end to end

Find one lot that has moved — `Stock history` or `Stock mutations` will show
it — and open the movement itself.

📸 What a movement records: which lot, from where, to where, why, and what
document caused it.

Why: our system logs movements too, and I want to know whether the reference's
movement carries a reason code, a work order reference, or both.

## 15. A machine

Open any machine from the `Machines` screen.

📸 Its detail screen.

Why: `Decoiler` turned up as the destination of a warehouse work order, and
options like `Slijpen (K320)` and `Laser` are processing steps. If a machine
carries capacity or a rate, that is how processing gets planned.

---

# ⚪ Still open from Purchase, if you happen to pass them

| # | | |
|---|---|---|
| 16 | Purchase quote `900002` | put `1000` gross, `5` line discount, `3` group discount on the line and screenshot `Net Price` — **30 seconds, settles a money rule** |
| 17 | Any product | the block reading *"Use StockOp for this product?"* on four products — if all unticked, a whole screen leaves scope |

---

## Reminders

- **`View` = `-empty-`** reveals every column a screen has, not just the saved
  layout.
- **Never leave a date filter's `from` box blank** to widen it — that voids the
  filter and returns nothing. Put a real date in, like `1-1-2000`.
- **`Show in Excel` beats a screenshot** every time. `Save as Excel` is blocked
  on your install; `Show in Excel` is not.
- A screen that is empty, or a button that does nothing, is still an answer —
  tell me the number and what happened.
