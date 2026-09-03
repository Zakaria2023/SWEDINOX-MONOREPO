# The reference system

`apps/dashboard` is being rebuilt to match an existing ERP — **easy2trade / Hego**,
version 3.13.0.499 — screen for screen. These notes are what has been read off
that system from screenshots: the columns each overview shows, where each figure
comes from, and — where it is not yet known — exactly what to do in the old
system to find out.

One file per screen, grouped the way its own `Overviews` tree groups them.

## Purchase

| Screen | Ours | State |
|---|---|---|
| [Order advice](purchase/order-advice.md) | `/order-advice` | columns matched; 6 open questions (unit enum + short-term formula resolved) |
| [Sold products not on the order recommendation](purchase/sold-products-not-advised.md) | `/sold-products-not-advised` | columns captured, not yet matched |
| [Purchase lines](purchase/purchase-lines.md) | `/purchase-lines` | columns captured, not yet matched |
| [Purchase quotes](purchase/purchase-quotes.md) | `/purchase-quotes` | columns captured, not yet matched |
| [Purchase results](purchase/purchase-results.md) | `/purchase-results` | columns captured, not yet matched |
| [Purchase invoice line](purchase/purchase-invoice-line.md) | `/purchase-invoice-line` | columns captured, not yet matched |
| [Purchase invoices](purchase/purchase-invoices.md) | `/purchase-invoices` | columns captured, not yet matched |
| [Net prices](purchase/net-prices.md) | not yet built | columns captured, not yet matched |
| [StockOn advice](purchase/stockon-advice.md) | not yet built | columns captured, not yet matched |
| [Purchase receivals](purchase/purchase-receivals.md) | not yet built | columns captured, not yet matched |
| [Import purchase invoices](purchase/import-purchase-invoices.md) | not yet built | columns captured — integration log, may be out of scope |
| [Purchase orders and quotes](purchase/purchase-orders-and-quotes.md) | not yet built | columns captured, not yet matched |

All 12 Purchase screens are now captured. Next: implement, once the open
questions in [STEPS.md](STEPS.md) are answered.

## Steps

[STEPS.md](STEPS.md) — every "go check the old system" action from every
screen above, as one flat numbered checklist. No questions, no reasoning — just
what to do, in order.

### The one question that unblocks the most

**The product hierarchy.** Three screens name it three different ways — Order
advice has `Main group`, Sold products has `Main group` + `Product group`,
Purchase results has `Main group` + `Subgroup`. Ours joins `ProductGroups` once.
Until that is settled, all three are guesswork. See
[purchase-results.md](purchase/purchase-results.md#-what-is-needed-before-this-can-be-built)
question 1 for exactly what to look at.

## Conventions worth knowing before reading any of these

**The unit suffix in a column heading is load-bearing, and it changes between
screens.** The same idea is counted differently depending on who is looking:

| Suffix | Means | Seen on |
|---|---|---|
| `(Kg)` | kilograms | Order advice — the position and all demand |
| `(Pur.U.)` | the unit the product is **bought** by | Order advice, Purchase lines |
| `(Stk.U.)` / `(StkU)` | the unit the product is **stocked** by | Sold products not on the order recommendation |

Order advice proves the purchase unit is not the stock unit: a line reading
`Available (Kg) 28,00` shows `Stock (Pur.U.) 0,03`, a factor of ~1000 — the
product is bought in **tonnes**. Any column without a suffix has to be treated
as unknown until confirmed.

**Overviews load on demand.** Every screen has a filter block at the top and a
`Show Data` button; the grid is empty until it is pressed. Ours load on
navigation, which is a deliberate difference — worth revisiting if these
datasets turn out to be large.

**Footers total, but not always by summing.** Order advice shows `Σ=` under most
numeric columns and `AVR=` under the two coverage columns. Coverage is a
duration, so a column of them averages rather than sums.

**Grids can be grouped by dragging a column header.** "Drag a column header here
to group by that column". Purchase lines ships grouped by `Receipt date`.

**A saved `View` names a column layout.** The dropdown next to `View` holds
named layouts (`besteladvies printver...`, `Aankomende ontvan...`), so the
column set for a screen is per-view, not fixed. What is documented here is the
default view that was open.

**Grids carry a filter bar at the bottom**, e.g. Purchase lines showing
`Purchase order type = Purchase order AND Supplier ≠ Hego Production`, with an
`Edit Filter` button. That is a user-built filter, not part of the screen.
