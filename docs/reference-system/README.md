# The reference system

`apps/dashboard` is being rebuilt to match an existing ERP — **easy2trade / Hego**,
version 3.13.0.499 — screen for screen. These notes are what has been read off
that system from screenshots: the columns each overview shows, where each figure
comes from, and — where it is not yet known — exactly what to do in the old
system to find out.

> **Start here for the current state:**
> [COVERAGE.md](COVERAGE.md) — **how much is actually built** ·
> [chart-of-accounts.md](chart-of-accounts.md) — the 27 accounts ·
> [LOGISTICS-BUILT.md](LOGISTICS-BUILT.md) — what is built ·
> [receipt-chain.md](receipt-chain.md) — how goods become stock ·
> [PLANNED-CODE-CHANGES.md](PLANNED-CODE-CHANGES.md) — every edit, and why ·
> [discount-basis.md](discount-basis.md) — the discounts cascade ·
> [reservations.md](reservations.md) — a reservation binds a lot ·
> [order-detail.md](order-detail.md) — a sales order, and the four price bases ·
> [customer-stock.md](customer-stock.md) — whose metal is in the rack ·
> [credit-and-blocking.md](credit-and-blocking.md) — creditspace, and 3 holds ·
> [order-types.md](order-types.md) — Stk vs CD ·
> [finance-screens.md](finance-screens.md) · [contracts.md](contracts.md) ·
> [PLANNED-CODE-CHANGES-2.md](PLANNED-CODE-CHANGES-2.md) — **queued, none applied** ·
> [fsp.md](fsp.md) — the price stock is carried at ·
> [empty-screens.md](empty-screens.md) — and the filter that lies ·
> [locations.md](locations.md) · [trip-data.md](trip-data.md) ·
> [exports/README.md](exports/README.md) — how to capture one, and what is on disk ·
> [NEXT-LOGISTICS.md](NEXT-LOGISTICS.md) — what to capture next

One file per screen, grouped the way its own `Overviews` tree groups them.

## Purchase

| Screen | Ours | State |
|---|---|---|
| [Order advice](purchase/order-advice.md) | `/order-advice` | **verified 262/262** against a real export; full 74-column palette inventoried |
| [Sold products not on the order recommendation](purchase/sold-products-not-advised.md) | `/sold-products-not-advised` | **verified 175/175** against a real export |
| [Purchase lines](purchase/purchase-lines.md) | `/purchase-lines` | **~50 columns matched** from 9 saved views; option pricing proved |
| [Purchase quotes](purchase/purchase-quotes.md) | `/purchase-quotes` | all 27 columns matched; **stays a read-only table** — at most one row in three years, questions moved to [MANAGER-QUESTIONS](MANAGER-QUESTIONS.md) |
| [Purchase results](purchase/purchase-results.md) | `/purchase-results` | **built** at the right grain; 3 dead columns left out |
| [Purchase invoice line](purchase/purchase-invoice-line.md) | `/purchase-invoice-line` | columns captured, not yet matched |
| [Purchase invoices](purchase/purchase-invoices.md) | `/purchase-invoices` | one invoice detail captured; 4 of 7 questions answered |
| [Net prices](purchase/net-prices.md) | not yet built | columns captured, not yet matched |
| [StockOn advice](purchase/stockon-advice.md) | not yet built | columns captured, not yet matched |
| [Purchase receivals](purchase/purchase-receivals.md) | not yet built | **all 25 columns matched** against a 151-row export; nothing left blocking |
| [Purchase orders and quotes](purchase/purchase-orders-and-quotes.md) | not yet built | columns captured, not yet matched |
| [Purchase order detail](purchase/purchase-order-detail.md) | not yet built | header, lines and 10 panels captured from order `400253` |

Two **master** screens are shared by every group, so they sit outside the
Purchase table:

| Screen | Ours | State |
|---|---|---|
| [Product master](product-detail.md) | the `/products` form | header and `Basis` panel captured; **the weight formula is proved here** |
| [Company master](company-detail.md) | the `/companies` form | 9 roles, creditor/debtor, and 17 panels captured |

All 12 Purchase screens are now captured, plus the purchase order detail
screen.

## Logistics

The whole group arrived on **8-9-2026** and is captured, built and checked.
**[LOGISTICS-BUILT.md](LOGISTICS-BUILT.md)** is the one to read: what changed,
what is left, and the three bugs it found.

| Screen | Ours | State |
|---|---|---|
| [Warehouse work orders](warehouse-workorders.md) | `/warehouse-work-orders` | **11 625-row export**; this is how goods are booked in |
| [Warehouse- and production workorders](warehouse-and-production-workorders.md) | `/warehouse-and-production-workorders` | `Weight deviation` is a **percentage**; releasing books a half-hour slot |
| [Receipts](receipts.md) | `/receipts` | the **six-state receipt ladder**; `Material still to be invoiced` is money |
| [Blocked deliveries](blocked-deliveries.md) | `/blocked-deliveries` | **proves the sales pricing rule to the cent** — and found a six-place bug |
| [Nesting](nesting.md) | `/nesting` | `Theor. Weight` is a **density** when its unit says `M3` |
| [Warehouse capacity](warehouse-capacity.md) | `/warehouse-capacity` | `Remaining = Occupied − Ready`; `Fetching` is subtyped by machine |
| [Transport status adjustments](transport-status-adjustments.md) | `/transport-status-adjustments` | the **seven**-state trip ladder |
| [Stock mutations](stock-mutations.md) | `/stock-movements` | every movement names the **work order** that caused it |
| [Transport work orders](transport-workorders.md) | `/transport-workorders` | the trip plan — and inbound goods are collected by one |
| [Stock on location](stock-on-location.md) | `/stock-on-location` | ~26 columns and 7 views matched; stock value and availability both proved |
| [Machines · Deliveries to arrange](machines-and-small-screens.md) | `/machines`, `/deliveries-to-arrange` | six machines, **no rate on any of them**; both screens fully answered |

Checked by the local harness `apps/dashboard/scripts/verify-logistics.ts` — 64
cases, each one a figure printed on one of those screens. See
[LOGISTICS-BUILT.md](LOGISTICS-BUILT.md) for how to run it.

## Steps and answers

**[PURCHASE-REMAINING.md](PURCHASE-REMAINING.md)** is the short answer to
"what is left in Purchase" — four things that can be done today, one waiting on
a thirty-second check, and two properly blocked on how goods actually arrive.

**[WHAT-I-NEED-FROM-YOU.md](WHAT-I-NEED-FROM-YOU.md)** is the one to hand
somebody sitting in front of the old system: every outstanding question as a
numbered click path, ranked, with the three that matter at the top.

Two more files sit alongside them:

- **[TIER1-RECIPES.md](TIER1-RECIPES.md)** — step-by-step recipes for creating
  the records the Tier 1 questions need, since the test system holds no example
  of what they ask about.
- **[MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md)** — questions that cannot be
  answered by clicking. They need someone who knows how the business works:
  what a field is *for*, whether a process is still used. Everything about
  **Purchase quotes** lives there.
- **[ACTIONS.md](ACTIONS.md)** — every action button, menu and grid affordance
  seen anywhere in the reference, per screen, with what it does and whether it
  is built. This is the list we build the UI from.
- **[IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md)** — what is built, what is
  next in order, what is blocked and on which answer, and the assumptions that
  are in the code waiting to be revisited. Read this first when picking the
  work back up.



Two files, and the split matters:

- **[STEPS.md](STEPS.md)** — only what is still **open**. Every "go check the
  old system" action from every screen above, as one flat numbered checklist.
  No questions, no reasoning — just what to do, in order.
- **[ANSWERED.md](ANSWERED.md)** — everything already settled, grouped by
  subject, with what changed in the code because of it. When a step is
  answered it moves out of STEPS.md and into here, so the checklist only ever
  shrinks.

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
