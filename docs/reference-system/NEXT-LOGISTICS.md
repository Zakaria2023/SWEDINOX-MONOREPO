# What I need from the Logistics group

Same shape as the Purchase list: open the screen, do the thing, send the
picture with its number.

**Round 2 is the live list** — everything below it has already arrived and is
kept for the record.

---

# 🔴 Round 2 — what I need next (9-9-2026)

Everything in the list below this section has arrived. These are the eight
things still missing, in the order they are worth doing. **Items 1–3 are the
ones that actually change code.**

## 🟢 The code side is finished

Everything these screens could settle has been built and verified —
**87 checks passing** against ~71 000 exported rows. See
[PLANNED-CODE-CHANGES.md](PLANNED-CODE-CHANGES.md).

**One thing is still outstanding and it needs you, not code:** the discount
basis. One quote line — gross `1000`, line discount `5`, group discount `3` —
and the `Net Price` it prints. `950` means both come off the gross; `921,50`
means the second comes off what the first left.

## Status after the 9-9-2026 walkthrough

| # | | |
|---|---|---|
| 1 | the receipt chain | ✅ **answered** — the lot exists before the invoice. [receipt-chain.md](receipt-chain.md) |
| 2 | the discount basis | 🔴 still open, still 60 seconds |
| 3 | `Trip data` | ✅ **arrived twice** — 438 trips, and the `-empty-` view proves **transport costing is switched off** (`Driver`/`Km`/`Cost price` empty on all 438). [trip-data.md](trip-data.md) |
| 4 | `Reservations` | 🟠 partly — `Reserved` is a column on every lot, but the screen itself is unseen |
| 5 | a customer-held delivery | ✅ **answered** — it is a **location type** (`Afroep`), not a boolean |
| 6 | `Locations` | ✅ **answered** — 1 940 locations, a three-level tree. `Locatie soort` is blank in the *grid* but populated on the detail (right-click → `Toon locatie`). [locations.md](locations.md) |
| 7 | a machine, opened | ✅ **answered** — there is no detail screen. A machine **is** a `Productie` location. [machines-and-small-screens.md](machines-and-small-screens.md) |
| 8 | `Stock mutations` as an export | ✅ **arrived** — 13 562 movements. Every one names the work order or **trip** that caused it. [stock-mutations.md](stock-mutations.md) |

### Also arrived 9-9-2026, unasked

| Screen | What it gave |
|---|---|
| **Warehouse- and production workorders** | a **13 610-line** export that **corrected `Weight deviation`** to a magnitude — the one thing built from this batch. Also: 3 statuses not 4, 33 half-hour slots, `Resource` empty throughout |
| **Deviations in count lists** | zero rows in both views, but its 22 columns identify it as the **stock-count correction** screen |
| **Deliveries to be arranged** | re-captured; confirmed the nine columns and the `Customer` sort fix. Its toolbar jumps to `Purchase lines` / `Warehouse workorders`, which ours lacks |
| **Locations** | `Toon locatie` is a **right-click**; the location carries `Location type` **and its own `Blocked` + `Reason`** |
| **Pick statistic** | a **1 332-row** export. `Picks` counts trips to the rack, and `Stock product = False` means **tube and pipe are not stocked** |

Newly opened by that walkthrough, in
[PLANNED-CODE-CHANGES.md §8](PLANNED-CODE-CHANGES.md): the aluminium weight
basis, `Plaatnummer`, the three bundle fields, and whether a remnant's supplier
is us or the original mill.

---

## 1. One purchase order traced end to end — the receipt chain

**This is the biggest gap in the build.** Our system creates the stock lot at
the *purchase invoice*. The reference creates it three steps earlier and I
cannot see exactly where. Everything about goods-in hangs on this.

Pick **one** purchase order that has been fully received — order number
`4xxxxx` — and walk it, screenshotting each step with the order number visible:

1. 📸 The order's own **`Receipts`** panel — the reception rows.
2. 📸 `Overviews → Logistics → Receipts`, filtered to that order.
3. 📸 `Overviews → Logistics → Warehouse workorders`, filtered to the same
   order — the `Unloading` work order(s) it produced.
4. 📸 The **stock lot** that resulted (`Stock on location`, filtered to the
   product) — I want its **lot/batch number**.
5. 📸 `Stock mutations`, filtered to that lot — the movement rows.

**What I am after:** which of those five things carries the *same* number as
which. If the lot number appears on the work order, the lot is created when the
work order is approved. If it first appears at the invoice, our model is right
and the docs are wrong. One order answers it.

---

## 2. The discount basis — 30 seconds, and it has been open for three rounds

Still the cheapest unanswered question in the whole system. Blocked deliveries
prints both discount columns and reads `0 %` on every row, so even the
best-placed screen did not settle it.

1. Open purchase quote **`900002`** (or any quote you can safely edit)
2. On one line put gross price **`1000`**, line discount **`5`**, group
   discount **`3`**
3. 📸 The line, showing **`Net Price`**

`950` means the discounts stack on the gross. `921,50` means the second applies
to what the first left. Two different numbers, one screenshot.

---

## 3. `Trip data` — the screen the trip ladder was inferred from, never seen

The seven trip states came from `Transport status adjustments`, which is an
*audit log of changes*, not the trips themselves. I have never seen a trip.

1. `Overviews → Logistics → Trip data`
2. `View` = **`-empty-`**, dates from `1-1-2024`, `Show Data`
3. 📸 The grid, then **`Show in Excel`**
4. 📸 Open **one** trip — its detail screen and its lines

**What I am after:** what a trip actually holds (carrier, vehicle, driver,
route, cost), and the unexplained pair — a `Bill of lading` numbered `300813`
against a `Trip number` numbered `600249`. Two series, two documents, one
delivery.

---

## 4. `Reservations` — a whole screen never captured

Two screens I have built point straight at it (`Blocked deliveries`, and
`Deliveries to be arranged **without stock reservation**`) and I have never
seen the thing itself.

`View` = `-empty-`, wide dates, 📸 the grid, then **`Show in Excel`**.

**What I am after:** whether a reservation binds a *lot* or just a quantity,
and whether it has its own status.

---

## 5. A blocked delivery that is held by the customer

Our model has three block booleans. The reference showed a fourth kind of hold —
a call-off line the customer is sitting on — that none of them can express.

1. `Blocked deliveries`, find a row whose reason is the customer / awaiting
   call-off
2. 📸 The row, and **whatever screen sets that block** (open the order line and
   find the tick that caused it)

---

## 6. `Locations` — with sections

The capacity export carried **17 sections and 48 subsections**; the screens show
twelve and fourteen. `Section` is a level above location and we do not model it.

`Overviews → Logistics → Locations`, `View` = `-empty-`, 📸 grid + **Excel**.

---

## 7. A machine, opened

Asked for last round and not delivered. Six machines, and **no rate on any of
them** in the list — so if a rate or a capacity exists, it is on the detail.

📸 One machine's detail screen, every tab.

**What I am after:** whether processing (`Slijpen`, `Laser`, `Decoilen`) is
planned against machine capacity, because `Fetching` turned out to be ten
separate capacity pools rather than one.

---

## 8. `Stock mutations`, as an export

I have the screenshot; I want the rows. A movement in the reference names the
work order that caused it, and ours has four document links of which **none is
a work order**.

`View` = `-empty-`, dates from `1-1-2024`, 📸 grid, then **`Show in Excel`**.

---

## ⚪ Never seen, low priority — only when we build them

`Freight movement` · `Revenue per product` · `Freight flow (SFN)` ·
`Pick statistic` · `Sawing layouts` · `Production capacity details` ·
`Capacity checks` · `Time registration` · `(Re)optimize` ·
`Deviations in count lists` · `Klant voorraad op locatie`

And one loose end: an order from the **`29xxxx`** series, opened. It behaves
like a purchase order but is not numbered like one, and I still cannot say what
it is.

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

All of it is built and checked — 64 cases against the figures those screens
printed. See [LOGISTICS-BUILT.md](LOGISTICS-BUILT.md).

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
