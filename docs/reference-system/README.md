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
| [Order advice](purchase/order-advice.md) | `/order-advice` | **verified 262/262** against a real export; full 74-column palette inventoried |
| [Sold products not on the order recommendation](purchase/sold-products-not-advised.md) | `/sold-products-not-advised` | **verified 175/175** against a real export |
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

### The product hierarchy — answered

Three screens name it three different ways — Order advice has `Main group`,
Sold products has `Main group` + `Product group`, Purchase results has
`Main group` + `Subgroup`. Sold products settled it by printing two levels at
once: it is **one hierarchy**, and `ProductGroups.parentUuid` models it.

The direction matters. `Main group` is the **root**, and `Product group` is the
product's own group *only when that group has a parent* — a product hung
straight off `Aluminum` shows a main group and a blank product group, not the
other way round. Both Order advice and Sold products now read it that way. See
[sold-products-not-advised.md](purchase/sold-products-not-advised.md#answered).

**The tree is deeper than two levels, and it is one table.** Clicking
"Show product group" repeatedly from a sized plate climbs four records, each
naming its parent in its **`Material group`** field:

```
5080          Aluminum                                    Material group: -empty-
 └─ ALUP      Aluminium plates                            Material group: Aluminum
     └─ 50801070   Aluminium plate semi-rigid 1S (Al 99.5) Material group: Aluminium plates
         └─ 6010040315  …3000x1500x4mm                    Material group: Aluminium plate semi-rigid 1S…
```

Every level opens the **same screen** with the same `Product` code field, so
the reference system does not separate products from product groups at all —
they are one self-referencing entity, and a "product" is simply a leaf that
carries dimensions. The root has no `Basis` panel because it has no physical
attributes to hold.

Two consequences for ours:

- `Main group` is the **root of the whole chain**, not the immediate parent.
  Both screens now climb three hops and take the highest name they find.
- We keep `Products` and `ProductGroups` as two tables. That is a deliberate
  divergence, and it works as long as our `ProductGroups` tree carries the
  upper levels and `Products` the leaves — which is what the four-level walk
  above maps onto cleanly.

**`Classification features → Product group` is a different thing entirely.**
It reads `Plaat` at every level of the walk and is greyed out — it mirrors the
`Product` type dropdown at the top of the screen, so it is the product's
**shape**, not its place in the hierarchy. The reference system uses the phrase
"product group" for two unrelated concepts; only the `Material group` chain is
the hierarchy the grids show.

`Subgroup` on [Purchase results](purchase/purchase-results.md) is still
unconfirmed, but now sits comfortably: with at least four levels there is
plenty of room for a screen to name an intermediate one.

## Conventions worth knowing before reading any of these

**The unit suffix in a column heading is load-bearing, and it changes between
screens.** The same idea is counted differently depending on who is looking:

| Suffix | Means | Seen on |
|---|---|---|
| `(Kg)` | kilograms | Order advice — the free position and all demand |
| `(Pur.U.)` | the unit the product is **bought** by | Order advice (4 columns), Purchase lines |
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
