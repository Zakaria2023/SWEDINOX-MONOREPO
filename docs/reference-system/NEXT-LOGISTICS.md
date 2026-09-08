# What I need from the Logistics group

Same shape as the Purchase list: open the screen, do the thing, send the
picture with its number.

**Start with 1 and 2.** Everything after them is ordinary column-capture and
can be done in any order, or not at all until we build that screen.

---

# 🔴 First — these two

## 1. The menu itself

Open **`Overviews → Logistics`** and expand it.

📸 The whole menu, so I can see every screen in the group and plan the rest
against it rather than guessing.

## 2. Warehouse work orders — the screen that finishes Purchase

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
